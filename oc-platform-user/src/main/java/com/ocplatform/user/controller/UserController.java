package com.ocplatform.user.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.user.dto.UpdateProfileRequest;
import com.ocplatform.user.dto.UserProfileVO;
import com.ocplatform.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ApiResponse<UserProfileVO> getProfile(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileVO> updateProfile(Authentication authentication,
                                                    @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(userService.updateProfile(userId, request));
    }

    @PutMapping("/language")
    public ApiResponse<Void> updateLanguage(Authentication authentication,
                                            @RequestBody Map<String, String> body) {
        Long userId = (Long) authentication.getPrincipal();
        userService.updateLanguage(userId, body.get("language"));
        return ApiResponse.success();
    }

    @GetMapping("/{id}/public")
    public ApiResponse<UserProfileVO> getPublicProfile(@PathVariable Long id) {
        return ApiResponse.success(userService.getPublicProfile(id));
    }

    @GetMapping("/me/theme")
    public ApiResponse<Map<String, String>> getTheme(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String themeConfig = userService.getThemeConfig(userId);
        return ApiResponse.success(Map.of("themeConfig", themeConfig != null ? themeConfig : ""));
    }

    @PutMapping("/me/theme")
    public ApiResponse<Void> updateTheme(Authentication authentication,
                                         @RequestBody Map<String, String> body) {
        Long userId = (Long) authentication.getPrincipal();
        userService.updateThemeConfig(userId, body.get("themeConfig"));
        return ApiResponse.success();
    }

    @PostMapping("/me/avatar")
    public ApiResponse<Map<String, String>> uploadAvatar(Authentication authentication,
                                                         @RequestParam("file") MultipartFile file) {
        Long userId = (Long) authentication.getPrincipal();
        String avatarUrl = userService.uploadAvatar(userId, file);
        return ApiResponse.success(Map.of("avatarUrl", avatarUrl));
    }
}
