package com.ocplatform.admin.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.user.dto.UserProfileVO;
import com.ocplatform.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<PageResponse<UserProfileVO>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(userService.listUsers(page, size, keyword, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserProfileVO> getUser(@PathVariable Long id) {
        return ApiResponse.success(userService.getProfile(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        userService.updateUserStatus(id, body.get("status"));
        return ApiResponse.success();
    }
}
