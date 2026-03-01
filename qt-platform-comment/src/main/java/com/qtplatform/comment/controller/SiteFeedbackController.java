package com.qtplatform.comment.controller;

import com.qtplatform.comment.dto.CreateFeedbackRequest;
import com.qtplatform.comment.dto.FeedbackVO;
import com.qtplatform.comment.service.SiteFeedbackService;
import com.qtplatform.common.response.ApiResponse;
import com.qtplatform.common.response.PageResponse;
import com.qtplatform.common.util.IpUtil;
import com.qtplatform.user.entity.User;
import com.qtplatform.user.repository.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
public class SiteFeedbackController {

    private final SiteFeedbackService feedbackService;
    private final UserMapper userMapper;

    @GetMapping
    public ApiResponse<PageResponse<FeedbackVO>> getFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            currentUserId = (Long) authentication.getPrincipal();
        }
        return ApiResponse.success(feedbackService.getRecentFeedbacks(page, size, currentUserId, sortBy, sortOrder));
    }

    @PostMapping
    public ApiResponse<FeedbackVO> createFeedback(
            @Valid @RequestBody CreateFeedbackRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            userId = (Long) authentication.getPrincipal();
        }
        if (userId == null) {
            return ApiResponse.error(40001, "请登录后再留言");
        }
        // 检查用户是否被锁定
        User user = userMapper.selectById(userId);
        if (user != null && "LOCKED".equals(user.getStatus())) {
            return ApiResponse.error(40003, "您的账户已被锁定，无法发表留言");
        }
        String ip = IpUtil.getClientIp(httpRequest);
        return ApiResponse.success(feedbackService.createFeedback(request, userId, ip));
    }

    @PostMapping("/{id}/like")
    public ApiResponse<Void> likeFeedback(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            userId = (Long) authentication.getPrincipal();
        }
        if (userId == null) {
            return ApiResponse.error(40001, "请登录后再点赞");
        }
        feedbackService.likeFeedback(id, userId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlikeFeedback(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            userId = (Long) authentication.getPrincipal();
        }
        if (userId == null) {
            return ApiResponse.error(40001, "请登录后操作");
        }
        feedbackService.unlikeFeedback(id, userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<FeedbackVO>> getAdminFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(feedbackService.getAllFeedbacksForAdmin(page, size, status, keyword));
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        feedbackService.updateFeedbackStatus(id, status);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ApiResponse.success(null);
    }
}
