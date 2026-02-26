package com.qtplatform.user.controller;

import com.qtplatform.common.response.ApiResponse;
import com.qtplatform.common.util.IpUtil;
import com.qtplatform.user.dto.*;
import com.qtplatform.user.service.AuthService;
import com.qtplatform.user.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ApiResponse.success();
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                            HttpServletRequest httpRequest) {
        String clientIp = IpUtil.getClientIp(httpRequest);
        LoginResponse response = authService.login(request, clientIp);
        return ApiResponse.success(response);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Authentication authentication,
                                    @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authentication != null) {
            Long userId = (Long) authentication.getPrincipal();
            String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
            authService.logout(userId, token);
        }
        return ApiResponse.success();
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ApiResponse.success(response);
    }

    @PostMapping("/send-code")
    public ApiResponse<Void> sendCode(@Valid @RequestBody SendCodeRequest request) {
        authService.sendVerificationCode(request);
        return ApiResponse.success();
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody SendCodeRequest request) {
        request.setType("RESET_PASSWORD");
        authService.sendVerificationCode(request);
        return ApiResponse.success();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success();
    }

    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(Authentication authentication,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        authService.changePassword(userId, request);
        return ApiResponse.success();
    }

    @PostMapping("/send-change-email-code")
    public ApiResponse<Void> sendChangeEmailCode(Authentication authentication,
                                                 @Valid @RequestBody SendChangeEmailCodeRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        // 发送验证码到新邮箱
        emailService.generateAndSendCode(request.getNewEmail(), "CHANGE_EMAIL");
        return ApiResponse.success();
    }

    @PutMapping("/change-email")
    public ApiResponse<Void> changeEmail(Authentication authentication,
                                         @Valid @RequestBody ChangeEmailRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        authService.changeEmail(userId, request.getCode(), request.getNewEmail());
        return ApiResponse.success();
    }
}
