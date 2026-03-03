package com.ocplatform.user.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.user.dto.LoginResponse;
import com.ocplatform.user.service.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oAuthService;

    @GetMapping("/github")
    public ApiResponse<Map<String, String>> getGithubAuthUrl() {
        return ApiResponse.success(Map.of("url", oAuthService.getGithubAuthUrl()));
    }

    @GetMapping("/github/callback")
    public ApiResponse<LoginResponse> githubCallback(@RequestParam String code) {
        LoginResponse response = oAuthService.handleGithubCallback(code);
        return ApiResponse.success(response);
    }

    @PostMapping("/bind")
    public ApiResponse<Void> bindOAuth(Authentication authentication,
                                       @RequestParam String provider,
                                       @RequestParam String code) {
        Long userId = (Long) authentication.getPrincipal();
        oAuthService.bindOAuth(userId, provider, code);
        return ApiResponse.success();
    }

    @DeleteMapping("/unbind/{provider}")
    public ApiResponse<Void> unbindOAuth(Authentication authentication,
                                         @PathVariable String provider) {
        Long userId = (Long) authentication.getPrincipal();
        oAuthService.unbindOAuth(userId, provider.toUpperCase());
        return ApiResponse.success();
    }
}
