package com.qtplatform.admin.controller;

import com.qtplatform.comment.dto.CommentVO;
import com.qtplatform.comment.service.CommentService;
import com.qtplatform.common.response.ApiResponse;
import com.qtplatform.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/comments")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminCommentController {

    private final CommentService commentService;

    @GetMapping
    public ApiResponse<PageResponse<CommentVO>> listComments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(commentService.listAllComments(page, size, status, productId, keyword));
    }

    @PutMapping("/{id}/audit")
    public ApiResponse<Void> auditComment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        commentService.auditComment(id, body.get("status"));
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id, null, true);
        return ApiResponse.success();
    }
}
