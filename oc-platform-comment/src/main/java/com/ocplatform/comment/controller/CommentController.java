package com.ocplatform.comment.controller;

import com.ocplatform.comment.dto.CommentVO;
import com.ocplatform.comment.dto.CreateCommentRequest;
import com.ocplatform.comment.service.CommentService;
import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.common.util.IpUtil;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.repository.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserMapper userMapper;

    @GetMapping("/product/{productId}")
    public ApiResponse<PageResponse<CommentVO>> getProductComments(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "time") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            Authentication authentication) {
        Long currentUserId = authentication != null ? (Long) authentication.getPrincipal() : null;
        return ApiResponse.success(commentService.getProductComments(productId, page, size, currentUserId, sortBy, sortOrder));
    }

    @PostMapping("/product/{productId}")
    public ApiResponse<CommentVO> createComment(
            @PathVariable Long productId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Long userId = (Long) authentication.getPrincipal();
        String ip = IpUtil.getClientIp(httpRequest);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        // 获取用户状态以检查是否被锁定
        User user = userMapper.selectById(userId);
        String userStatus = user != null ? user.getStatus() : null;
        return ApiResponse.success(commentService.createComment(productId, request, userId, ip, isAdmin, userStatus));
    }

    @PutMapping("/{id}")
    public ApiResponse<CommentVO> updateComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(commentService.updateComment(id, body.get("content"), userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        commentService.deleteComment(id, userId, isAdmin);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/like")
    public ApiResponse<Void> likeComment(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        commentService.likeComment(id, userId);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/like")
    public ApiResponse<Void> unlikeComment(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        commentService.unlikeComment(id, userId);
        return ApiResponse.success();
    }
}
