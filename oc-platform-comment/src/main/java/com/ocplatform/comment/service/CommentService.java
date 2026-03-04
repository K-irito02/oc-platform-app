package com.ocplatform.comment.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocplatform.comment.dto.CommentVO;
import com.ocplatform.comment.dto.CreateCommentRequest;
import com.ocplatform.comment.entity.CommentLike;
import com.ocplatform.comment.entity.ProductComment;
import com.ocplatform.comment.repository.CommentLikeMapper;
import com.ocplatform.comment.repository.ProductCommentMapper;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final ProductCommentMapper commentMapper;
    private final CommentLikeMapper commentLikeMapper;
    private final ObjectMapper objectMapper;

    public PageResponse<CommentVO> getProductComments(Long productId, int page, int size, Long currentUserId,
                                                      String sortBy, String sortOrder) {
        Page<ProductComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ProductComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductComment::getProductId, productId)
                .eq(ProductComment::getStatus, "PUBLISHED")
                .isNull(ProductComment::getParentId);
        
        // Apply sorting
        boolean isAsc = "asc".equalsIgnoreCase(sortOrder);
        switch (sortBy != null ? sortBy : "time") {
            case "likes":
                if (isAsc) wrapper.orderByAsc(ProductComment::getLikeCount);
                else wrapper.orderByDesc(ProductComment::getLikeCount);
                break;
            case "rating":
                if (isAsc) wrapper.orderByAsc(ProductComment::getRating);
                else wrapper.orderByDesc(ProductComment::getRating);
                break;
            case "replies":
                if (isAsc) wrapper.orderByAsc(ProductComment::getReplyCount);
                else wrapper.orderByDesc(ProductComment::getReplyCount);
                break;
            case "time":
            default:
                if (isAsc) wrapper.orderByAsc(ProductComment::getCreatedAt);
                else wrapper.orderByDesc(ProductComment::getCreatedAt);
                break;
        }

        Page<ProductComment> result = commentMapper.selectPage(pageParam, wrapper);
        List<CommentVO> vos = result.getRecords().stream()
                .map(c -> toVOWithReplies(c, currentUserId))
                .collect(Collectors.toList());

        // 计算总评论数（包含回复）
        LambdaQueryWrapper<ProductComment> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.eq(ProductComment::getProductId, productId)
                .eq(ProductComment::getStatus, "PUBLISHED");
        long totalWithReplies = commentMapper.selectCount(totalWrapper);

        PageResponse<CommentVO> response = PageResponse.of(vos, result.getTotal(), page, size);
        response.setTotalWithReplies(totalWithReplies);
        return response;
    }

    @Transactional
    public CommentVO createComment(Long productId, CreateCommentRequest request, Long userId, String ipAddress, boolean isAdmin, String userStatus) {
        if ("LOCKED".equals(userStatus)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "您的账户已被锁定，无法发表评论");
        }
        
        if (!isAdmin) {
            LambdaQueryWrapper<ProductComment> rateLimitCheck = new LambdaQueryWrapper<>();
            rateLimitCheck.eq(ProductComment::getUserId, userId)
                    .ge(ProductComment::getCreatedAt, java.time.OffsetDateTime.now().minusSeconds(60));
            if (commentMapper.selectCount(rateLimitCheck) > 0) {
                throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, "评论发布过于频繁，请稍后再试");
            }
        }

        if (request.getParentId() != null) {
            ProductComment parent = commentMapper.selectById(request.getParentId());
            if (parent == null || !parent.getProductId().equals(productId)) {
                throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND, "父评论不存在");
            }
        }

        String status = isAdmin ? "PUBLISHED" : "PENDING";

        ProductComment comment = ProductComment.builder()
                .productId(productId)
                .userId(userId)
                .parentId(request.getParentId())
                .content(request.getContent())
                .rating(request.getParentId() == null ? request.getRating() : null)
                .status(status)
                .likeCount(0)
                .replyCount(0)
                .ipAddress(ipAddress)
                .build();
        commentMapper.insert(comment);
        
        if (request.getParentId() != null) {
            commentMapper.incrementReplyCount(request.getParentId());
        }

        if (request.getRating() != null && request.getParentId() == null && "PUBLISHED".equals(status)) {
            updateProductRatingStats(productId);
        }

        log.info("Comment created: id={}, product={}, user={}, admin={}, rating={}", 
                comment.getId(), productId, userId, isAdmin, comment.getRating());
        return toVO(comment, false);
    }

    @Transactional
    public CommentVO updateComment(Long commentId, String content, Long userId) {
        ProductComment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        comment.setContent(content);
        commentMapper.updateById(comment);
        return toVO(comment, false);
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, boolean isAdmin) {
        ProductComment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        if (!isAdmin && !comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        
        Long productId = comment.getProductId();
        Integer rating = comment.getRating();
        Long parentId = comment.getParentId();
        boolean wasPublished = "PUBLISHED".equals(comment.getStatus());
        
        commentMapper.deleteById(commentId);
        
        if (parentId != null) {
            commentMapper.decrementReplyCount(parentId);
        }
        
        if (rating != null && parentId == null && wasPublished) {
            updateProductRatingStats(productId);
        }
    }

    @Transactional
    public void likeComment(Long commentId, Long userId) {
        if (commentLikeMapper.existsByCommentAndUser(commentId, userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ALREADY_LIKED);
        }
        commentLikeMapper.insert(CommentLike.builder()
                .commentId(commentId)
                .userId(userId)
                .build());
        commentMapper.incrementLikeCount(commentId);
    }

    @Transactional
    public void unlikeComment(Long commentId, Long userId) {
        int deleted = commentLikeMapper.deleteByCommentAndUser(commentId, userId);
        if (deleted > 0) {
            commentMapper.decrementLikeCount(commentId);
        }
    }

    public void auditComment(Long commentId, String status) {
        ProductComment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        String oldStatus = comment.getStatus();
        comment.setStatus(status);
        commentMapper.updateById(comment);
        
        if (comment.getRating() != null && comment.getParentId() == null) {
            boolean shouldUpdateStats = false;
            if ("PUBLISHED".equals(status) && !"PUBLISHED".equals(oldStatus)) {
                shouldUpdateStats = true;
            } else if (!"PUBLISHED".equals(status) && "PUBLISHED".equals(oldStatus)) {
                shouldUpdateStats = true;
            }
            if (shouldUpdateStats) {
                updateProductRatingStats(comment.getProductId());
            }
        }
        
        log.info("Comment audited: id={}, status={}", commentId, status);
    }

    public PageResponse<CommentVO> listAllComments(int page, int size, String status, Long productId, String keyword) {
        Page<ProductComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ProductComment> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(ProductComment::getStatus, status);
        if (productId != null) wrapper.eq(ProductComment::getProductId, productId);
        
        // 支持关键词搜索（用户名/邮箱/ID）
        if (StringUtils.hasText(keyword)) {
            // 解析精确搜索类型
            String searchType = "all";
            String searchValue = keyword;
            
            if (keyword.contains(":")) {
                String[] parts = keyword.split(":", 2);
                if (parts.length == 2) {
                    searchType = parts[0];
                    searchValue = parts[1];
                }
            }
            
            log.info("Search parameters - type: {}, value: '{}', status: '{}', productId: {}", 
                    searchType, searchValue, status, productId);
            
            // 使用自定义JOIN查询方法
            List<ProductComment> searchResults = commentMapper.searchCommentsWithUser(status, productId, searchType, searchValue);
            Page<ProductComment> result = new Page<>(page, size);
            result.setRecords(searchResults.stream()
                    .skip((long) (page - 1) * size)
                    .limit(size)
                    .collect(Collectors.toList()));
            result.setTotal(searchResults.size());
            
            List<CommentVO> vos = result.getRecords().stream()
                    .map(c -> toVO(c, false))
                    .collect(Collectors.toList());
            return PageResponse.of(vos, result.getTotal(), page, size);
        }
        
        wrapper.orderByDesc(ProductComment::getCreatedAt);

        Page<ProductComment> result = commentMapper.selectPage(pageParam, wrapper);
        List<CommentVO> vos = result.getRecords().stream()
                .map(c -> toVO(c, false))
                .collect(Collectors.toList());
        return PageResponse.of(vos, result.getTotal(), page, size);
    }

    private CommentVO toVOWithReplies(ProductComment comment, Long currentUserId) {
        CommentVO vo = toVO(comment, currentUserId != null && commentLikeMapper.existsByCommentAndUser(comment.getId(), currentUserId));

        // Load replies
        LambdaQueryWrapper<ProductComment> replyWrapper = new LambdaQueryWrapper<>();
        replyWrapper.eq(ProductComment::getParentId, comment.getId())
                .eq(ProductComment::getStatus, "PUBLISHED")
                .orderByAsc(ProductComment::getCreatedAt);
        List<ProductComment> replies = commentMapper.selectList(replyWrapper);
        if (!replies.isEmpty()) {
            vo.setReplies(replies.stream()
                    .map(r -> toVOWithReplies(r, currentUserId))
                    .collect(Collectors.toList()));
        } else {
            vo.setReplies(Collections.emptyList());
        }
        return vo;
    }

    private CommentVO toVO(ProductComment c, boolean liked) {
        String username = commentMapper.getUsernameById(c.getUserId());
        String avatarUrl = commentMapper.getAvatarUrlById(c.getUserId());
        
        // 获取回复目标用户信息
        Long replyToUserId = null;
        String replyToUsername = null;
        if (c.getParentId() != null) {
            ProductComment parentComment = commentMapper.selectById(c.getParentId());
            if (parentComment != null) {
                replyToUserId = parentComment.getUserId();
                replyToUsername = commentMapper.getUsernameById(parentComment.getUserId());
            }
        }
        
        return CommentVO.builder()
                .id(c.getId())
                .productId(c.getProductId())
                .userId(c.getUserId())
                .username(username)
                .avatarUrl(avatarUrl)
                .parentId(c.getParentId())
                .content(c.getContent())
                .rating(c.getRating())
                .status(c.getStatus())
                .likeCount(c.getLikeCount() != null ? c.getLikeCount() : 0)
                .replyCount(c.getReplyCount() != null ? c.getReplyCount() : 0)
                .liked(liked)
                .replyToUserId(replyToUserId)
                .replyToUsername(replyToUsername)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private void updateProductRatingStats(Long productId) {
        Double avgRating = commentMapper.getAverageRating(productId);
        int totalCount = commentMapper.getRatingCount(productId);
        List<Map<String, Object>> distributionList = commentMapper.getRatingDistribution(productId);

        Map<Integer, Integer> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0);
        }
        for (Map<String, Object> item : distributionList) {
            Integer rating = (Integer) item.get("rating");
            Long count = (Long) item.get("count");
            distribution.put(rating, count.intValue());
        }

        String distributionJson;
        try {
            distributionJson = objectMapper.writeValueAsString(distribution);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize rating distribution", e);
            distributionJson = "{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}";
        }

        double avg = avgRating != null ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0;
        commentMapper.updateProductRatingStats(productId, avg, totalCount, distributionJson);

        log.info("Product rating stats updated from comments: productId={}, avg={}, count={}", productId, avg, totalCount);
    }
}
