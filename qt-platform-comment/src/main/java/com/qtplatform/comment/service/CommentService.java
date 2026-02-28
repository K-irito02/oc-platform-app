package com.qtplatform.comment.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qtplatform.comment.dto.CommentVO;
import com.qtplatform.comment.dto.CreateCommentRequest;
import com.qtplatform.comment.entity.CommentLike;
import com.qtplatform.comment.entity.ProductComment;
import com.qtplatform.comment.repository.CommentLikeMapper;
import com.qtplatform.comment.repository.ProductCommentMapper;
import com.qtplatform.common.exception.BusinessException;
import com.qtplatform.common.response.ErrorCode;
import com.qtplatform.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final ProductCommentMapper commentMapper;
    private final CommentLikeMapper commentLikeMapper;

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
    public CommentVO createComment(Long productId, CreateCommentRequest request, Long userId, String ipAddress) {
        // 限流：防止用户频繁发布评论（同一用户60秒内只能发布一条评论）
        LambdaQueryWrapper<ProductComment> rateLimitCheck = new LambdaQueryWrapper<>();
        rateLimitCheck.eq(ProductComment::getUserId, userId)
                .ge(ProductComment::getCreatedAt, java.time.OffsetDateTime.now().minusSeconds(60));
        if (commentMapper.selectCount(rateLimitCheck) > 0) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, "评论发布过于频繁，请稍后再试");
        }
        
        // Check for duplicate rating
        if (request.getRating() != null && request.getParentId() == null) {
            LambdaQueryWrapper<ProductComment> ratingCheck = new LambdaQueryWrapper<>();
            ratingCheck.eq(ProductComment::getProductId, productId)
                    .eq(ProductComment::getUserId, userId)
                    .isNotNull(ProductComment::getRating)
                    .isNull(ProductComment::getParentId);
            if (commentMapper.selectCount(ratingCheck) > 0) {
                throw new BusinessException(ErrorCode.DUPLICATE_RATING);
            }
        }

        // Validate parent exists
        if (request.getParentId() != null) {
            ProductComment parent = commentMapper.selectById(request.getParentId());
            if (parent == null || !parent.getProductId().equals(productId)) {
                throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND, "父评论不存在");
            }
        }

        ProductComment comment = ProductComment.builder()
                .productId(productId)
                .userId(userId)
                .parentId(request.getParentId())
                .content(request.getContent())
                .rating(request.getParentId() == null ? request.getRating() : null)
                .status("PENDING")
                .likeCount(0)
                .replyCount(0)
                .ipAddress(ipAddress)
                .build();
        commentMapper.insert(comment);
        
        // 更新父评论的reply_count
        if (request.getParentId() != null) {
            commentMapper.incrementReplyCount(request.getParentId());
        }

        log.info("Comment created: id={}, product={}, user={}", comment.getId(), productId, userId);
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
        commentMapper.deleteById(commentId);
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
        comment.setStatus(status);
        commentMapper.updateById(comment);

        // If published and has rating, recalculate product rating
        if ("PUBLISHED".equals(status) && comment.getRating() != null) {
            updateProductRating(comment.getProductId());
        }
    }

    public void updateProductRating(Long productId) {
        Double avg = commentMapper.getAverageRating(productId);
        int count = commentMapper.getRatingCount(productId);
        // This needs ProductMapper - will be called from admin module
        // For now just log
        log.info("Product {} rating updated: avg={}, count={}", productId, avg, count);
    }

    public PageResponse<CommentVO> listAllComments(int page, int size, String status, Long productId) {
        Page<ProductComment> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ProductComment> wrapper = new LambdaQueryWrapper<>();
        if (status != null) wrapper.eq(ProductComment::getStatus, status);
        if (productId != null) wrapper.eq(ProductComment::getProductId, productId);
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
        String nickname = commentMapper.getNicknameById(c.getUserId());
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
                .nickname(nickname)
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
}
