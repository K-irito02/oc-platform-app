package com.ocplatform.comment.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ocplatform.comment.dto.CreateFeedbackRequest;
import com.ocplatform.comment.dto.FeedbackVO;
import com.ocplatform.comment.entity.SiteFeedback;
import com.ocplatform.comment.entity.SiteFeedbackLike;
import com.ocplatform.comment.repository.SiteFeedbackLikeMapper;
import com.ocplatform.comment.repository.SiteFeedbackMapper;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteFeedbackService {

    private final SiteFeedbackMapper feedbackMapper;
    private final SiteFeedbackLikeMapper feedbackLikeMapper;
    private final UserMapper userMapper;

    @Transactional
    public FeedbackVO createFeedback(CreateFeedbackRequest request, Long userId, String ipAddress) {
        if (userId == null) {
            throw new IllegalArgumentException("用户必须登录才能留言");
        }
        
        // 从用户信息中获取邮箱和昵称
        User user = userMapper.selectById(userId);
        String userEmail = user != null ? user.getEmail() : null;
        
        SiteFeedback feedback = SiteFeedback.builder()
                .userId(userId)
                .parentId(request.getParentId())
                .email(userEmail)
                .contact(request.getContact())
                .content(request.getContent())
                .status("PUBLISHED")
                .ipAddress(ipAddress)
                .likeCount(0)
                .replyCount(0)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        
        feedbackMapper.insert(feedback);
        
        // 如果是回复，更新父留言的回复数
        if (request.getParentId() != null) {
            SiteFeedback parent = feedbackMapper.selectById(request.getParentId());
            if (parent != null) {
                parent.setReplyCount((parent.getReplyCount() != null ? parent.getReplyCount() : 0) + 1);
                parent.setUpdatedAt(OffsetDateTime.now());
                feedbackMapper.updateById(parent);
            }
        }
        
        log.info("Feedback created: id={}, user={}, parentId={}", feedback.getId(), userId, request.getParentId());
        
        return toVO(feedback, userId, null);
    }

    public PageResponse<FeedbackVO> getRecentFeedbacks(int page, int size, Long currentUserId, 
            String sortBy, String sortOrder) {
        Page<SiteFeedback> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<SiteFeedback> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteFeedback::getStatus, "PUBLISHED")
               .eq(SiteFeedback::getIsPublic, true)
               .isNull(SiteFeedback::getParentId); // 只查询顶级留言
        
        // 排序
        if ("likes".equals(sortBy)) {
            if ("asc".equals(sortOrder)) {
                wrapper.orderByAsc(SiteFeedback::getLikeCount);
            } else {
                wrapper.orderByDesc(SiteFeedback::getLikeCount);
            }
        } else if ("replies".equals(sortBy)) {
            if ("asc".equals(sortOrder)) {
                wrapper.orderByAsc(SiteFeedback::getReplyCount);
            } else {
                wrapper.orderByDesc(SiteFeedback::getReplyCount);
            }
        } else {
            // 默认按时间排序
            if ("asc".equals(sortOrder)) {
                wrapper.orderByAsc(SiteFeedback::getCreatedAt);
            } else {
                wrapper.orderByDesc(SiteFeedback::getCreatedAt);
            }
        }
        
        Page<SiteFeedback> result = feedbackMapper.selectPage(pageParam, wrapper);
        List<FeedbackVO> vos = result.getRecords().stream()
                .map(f -> toVOWithReplies(f, currentUserId))
                .collect(Collectors.toList());
        
        // 计算包含回复的总数
        LambdaQueryWrapper<SiteFeedback> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.eq(SiteFeedback::getStatus, "PUBLISHED")
                   .eq(SiteFeedback::getIsPublic, true);
        long totalWithReplies = feedbackMapper.selectCount(totalWrapper);
        
        PageResponse<FeedbackVO> response = PageResponse.of(vos, result.getTotal(), page, size);
        response.setTotalWithReplies(totalWithReplies);
        return response;
    }

    @Transactional
    public void likeFeedback(Long feedbackId, Long userId) {
        // 检查是否已点赞
        LambdaQueryWrapper<SiteFeedbackLike> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteFeedbackLike::getFeedbackId, feedbackId)
               .eq(SiteFeedbackLike::getUserId, userId);
        if (feedbackLikeMapper.selectCount(wrapper) > 0) {
            throw new IllegalStateException("已点赞");
        }
        
        // 创建点赞记录
        SiteFeedbackLike like = SiteFeedbackLike.builder()
                .feedbackId(feedbackId)
                .userId(userId)
                .createdAt(OffsetDateTime.now())
                .build();
        feedbackLikeMapper.insert(like);
        
        // 更新点赞数
        SiteFeedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback != null) {
            feedback.setLikeCount((feedback.getLikeCount() != null ? feedback.getLikeCount() : 0) + 1);
            feedbackMapper.updateById(feedback);
        }
    }

    @Transactional
    public void unlikeFeedback(Long feedbackId, Long userId) {
        LambdaQueryWrapper<SiteFeedbackLike> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteFeedbackLike::getFeedbackId, feedbackId)
               .eq(SiteFeedbackLike::getUserId, userId);
        int deleted = feedbackLikeMapper.delete(wrapper);
        
        if (deleted > 0) {
            SiteFeedback feedback = feedbackMapper.selectById(feedbackId);
            if (feedback != null && feedback.getLikeCount() != null && feedback.getLikeCount() > 0) {
                feedback.setLikeCount(feedback.getLikeCount() - 1);
                feedbackMapper.updateById(feedback);
            }
        }
    }

    public PageResponse<FeedbackVO> getAllFeedbacksForAdmin(int page, int size, String status, String keyword) {
        Page<SiteFeedback> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<SiteFeedback> wrapper = new LambdaQueryWrapper<>();
        
        if (status != null && !status.isEmpty()) {
            wrapper.eq(SiteFeedback::getStatus, status);
        }
        if (keyword != null && !keyword.isEmpty()) {
            // 支持按字段类型搜索：格式为 "searchType:value"
            if (keyword.contains(":")) {
                String[] parts = keyword.split(":", 2);
                String searchType = parts[0];
                String searchValue = parts.length > 1 ? parts[1] : "";
                
                if (!searchValue.isEmpty()) {
                    switch (searchType) {
                        case "feedbackId":
                            try {
                                Long feedbackId = Long.parseLong(searchValue);
                                wrapper.eq(SiteFeedback::getId, feedbackId);
                            } catch (NumberFormatException e) {
                                // 无效的ID格式，返回空结果
                                wrapper.eq(SiteFeedback::getId, -1);
                            }
                            break;
                        case "userId":
                            try {
                                Long userId = Long.parseLong(searchValue);
                                wrapper.eq(SiteFeedback::getUserId, userId);
                            } catch (NumberFormatException e) {
                                wrapper.eq(SiteFeedback::getUserId, -1);
                            }
                            break;
                        case "username":
                            // 通过用户名搜索需要先查询用户ID
                            List<Long> userIdsByUsername = userMapper.selectList(
                                new LambdaQueryWrapper<User>().like(User::getUsername, searchValue)
                            ).stream().map(User::getId).collect(Collectors.toList());
                            if (userIdsByUsername.isEmpty()) {
                                wrapper.eq(SiteFeedback::getUserId, -1);
                            } else {
                                wrapper.in(SiteFeedback::getUserId, userIdsByUsername);
                            }
                            break;
                        case "email":
                            wrapper.like(SiteFeedback::getEmail, searchValue);
                            break;
                        case "content":
                            wrapper.like(SiteFeedback::getContent, searchValue);
                            break;
                        case "parentId":
                            try {
                                Long parentId = Long.parseLong(searchValue);
                                wrapper.eq(SiteFeedback::getParentId, parentId);
                            } catch (NumberFormatException e) {
                                wrapper.eq(SiteFeedback::getParentId, -1);
                            }
                            break;
                        default:
                            wrapper.and(w -> w.like(SiteFeedback::getContent, searchValue)
                                    .or().like(SiteFeedback::getEmail, searchValue));
                            break;
                    }
                }
            } else {
                wrapper.and(w -> w.like(SiteFeedback::getContent, keyword)
                        .or().like(SiteFeedback::getEmail, keyword));
            }
        }
        wrapper.orderByDesc(SiteFeedback::getCreatedAt);
        
        Page<SiteFeedback> result = feedbackMapper.selectPage(pageParam, wrapper);
        List<FeedbackVO> vos = result.getRecords().stream()
                .map(f -> toAdminVO(f))
                .collect(Collectors.toList());
        
        return PageResponse.of(vos, result.getTotal(), page, size);
    }

    @Transactional
    public void updateFeedbackStatus(Long feedbackId, String status) {
        SiteFeedback feedback = feedbackMapper.selectById(feedbackId);
        if (feedback != null) {
            feedback.setStatus(status);
            feedback.setUpdatedAt(OffsetDateTime.now());
            feedbackMapper.updateById(feedback);
        }
    }

    @Transactional
    public void deleteFeedback(Long feedbackId) {
        // 先删除所有回复
        LambdaQueryWrapper<SiteFeedback> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteFeedback::getParentId, feedbackId);
        feedbackMapper.delete(wrapper);
        
        // 删除点赞记录
        LambdaQueryWrapper<SiteFeedbackLike> likeWrapper = new LambdaQueryWrapper<>();
        likeWrapper.eq(SiteFeedbackLike::getFeedbackId, feedbackId);
        feedbackLikeMapper.delete(likeWrapper);
        
        // 删除留言本身
        feedbackMapper.deleteById(feedbackId);
    }

    private FeedbackVO toVOWithReplies(SiteFeedback f, Long currentUserId) {
        FeedbackVO vo = toVO(f, currentUserId, null);
        
        // 加载回复
        LambdaQueryWrapper<SiteFeedback> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SiteFeedback::getParentId, f.getId())
               .eq(SiteFeedback::getStatus, "PUBLISHED")
               .orderByAsc(SiteFeedback::getCreatedAt);
        List<SiteFeedback> replies = feedbackMapper.selectList(wrapper);
        
        // 获取父级留言的用户名作为被回复人
        String parentName = vo.getUsername() != null ? vo.getUsername() : vo.getNickname();
        
        vo.setReplies(replies.stream()
                .map(r -> toVO(r, currentUserId, parentName))
                .collect(Collectors.toList()));
        
        return vo;
    }

    private FeedbackVO toVO(SiteFeedback f, Long currentUserId, String replyToName) {
        String username = null;
        String avatarUrl = null;
        
        if (f.getUserId() != null) {
            User user = userMapper.selectById(f.getUserId());
            if (user != null) {
                username = user.getUsername();
                avatarUrl = user.getAvatarUrl();
            }
        }
        
        Boolean liked = false;
        if (currentUserId != null) {
            LambdaQueryWrapper<SiteFeedbackLike> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(SiteFeedbackLike::getFeedbackId, f.getId())
                   .eq(SiteFeedbackLike::getUserId, currentUserId);
            liked = feedbackLikeMapper.selectCount(wrapper) > 0;
        }
        
        return FeedbackVO.builder()
                .id(f.getId())
                .userId(f.getUserId())
                .parentId(f.getParentId())
                .nickname(username != null ? username : "匿名用户")
                .username(username)
                .avatarUrl(avatarUrl)
                .replyToName(replyToName)
                .content(f.getContent())
                .likeCount(f.getLikeCount() != null ? f.getLikeCount() : 0)
                .replyCount(f.getReplyCount() != null ? f.getReplyCount() : 0)
                .liked(liked)
                .isPublic(f.getIsPublic())
                .createdAt(f.getCreatedAt())
                .build();
    }

    private FeedbackVO toAdminVO(SiteFeedback f) {
        String username = null;
        String avatarUrl = null;
        String userEmail = f.getEmail();
        
        if (f.getUserId() != null) {
            User user = userMapper.selectById(f.getUserId());
            if (user != null) {
                username = user.getUsername();
                avatarUrl = user.getAvatarUrl();
                if (userEmail == null) {
                    userEmail = user.getEmail();
                }
            }
        }
        
        return FeedbackVO.builder()
                .id(f.getId())
                .userId(f.getUserId())
                .parentId(f.getParentId())
                .nickname(username)
                .username(username)
                .email(userEmail)
                .avatarUrl(avatarUrl)
                .replyToName(null)
                .content(f.getContent())
                .likeCount(f.getLikeCount() != null ? f.getLikeCount() : 0)
                .replyCount(f.getReplyCount() != null ? f.getReplyCount() : 0)
                .liked(false)
                .isPublic(f.getIsPublic())
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .replies(null)
                .build();
    }
}
