package com.ocplatform.user.service;

import com.ocplatform.common.constant.RedisKeys;
import com.ocplatform.common.dto.CaptchaVerifyRequest;
import com.ocplatform.common.dto.CaptchaVerifyResponse;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.service.CaptchaService;
import com.ocplatform.common.util.JwtUtil;
import com.ocplatform.user.dto.*;
import com.ocplatform.user.entity.Role;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.entity.UserRole;
import com.ocplatform.user.repository.RoleMapper;
import com.ocplatform.user.repository.UserMapper;
import com.ocplatform.user.repository.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate stringRedisTemplate;
    private final CaptchaService captchaService;

    @Transactional
    public void register(RegisterRequest request) {
        // 验证码校验
        if (captchaService.isEnabled()) {
            if (request.getCaptchaToken() == null) {
                throw new BusinessException(400, "请完成验证码验证");
            }
            CaptchaVerifyRequest captchaRequest = new CaptchaVerifyRequest();
            captchaRequest.setToken(request.getCaptchaToken());
            captchaRequest.setScene("REGISTER");
            CaptchaVerifyResponse captchaResponse = captchaService.verify(captchaRequest, null, null);
            if (!captchaResponse.getSuccess()) {
                throw new BusinessException(400, "验证码验证失败");
            }
        }

        // Verify code
        if (!emailService.verifyCode(request.getEmail(), request.getVerificationCode(), "REGISTER")) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID);
        }

        // Check duplicates
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new BusinessException(ErrorCode.USERNAME_EXISTS);
        }
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .language(request.getLanguage() != null ? request.getLanguage() : "zh-CN")
                .emailVerified(true)
                .build();
        userMapper.insert(user);

        // Assign USER role
        Role userRole = roleMapper.findByCode("USER")
                .orElseThrow(() -> new BusinessException(ErrorCode.UNKNOWN_ERROR, "角色配置异常"));
        userRoleMapper.insert(UserRole.builder()
                .userId(user.getId())
                .roleId(userRole.getId())
                .build());

        log.info("User registered: {}", user.getUsername());
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        // 验证码校验
        if (captchaService.isEnabled()) {
            if (request.getCaptchaToken() == null) {
                throw new BusinessException(400, "请完成验证码验证");
            }
            CaptchaVerifyRequest captchaRequest = new CaptchaVerifyRequest();
            captchaRequest.setToken(request.getCaptchaToken());
            captchaRequest.setScene("LOGIN");
            CaptchaVerifyResponse captchaResponse = captchaService.verify(captchaRequest, clientIp, null);
            if (!captchaResponse.getSuccess()) {
                throw new BusinessException(400, "验证码验证失败");
            }
        }

        String limitKey = RedisKeys.LIMIT_LOGIN + clientIp;
        Long attempts = stringRedisTemplate.opsForValue().increment(limitKey);
        if (attempts != null && attempts == 1) {
            stringRedisTemplate.expire(limitKey, 15, TimeUnit.MINUTES);
        }
        if (attempts != null && attempts > 5) {
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS, "登录尝试过于频繁，请 15 分钟后再试");
        }

        String account = request.getAccount().trim();
        User user;
        
        if (account.contains("@")) {
            user = userMapper.findByEmail(account)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_REGISTERED));
        } else {
            user = userMapper.findByUsername(account)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_REGISTERED));
        }

        if ("BANNED".equals(user.getStatus()) || "LOCKED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }

        // Clear rate limit on successful login
        stringRedisTemplate.delete(limitKey);

        // Update last login info
        userMapper.updateLoginInfo(user.getId(), clientIp);

        return buildLoginResponse(user);
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        Long userId = jwtUtil.getUserIdFromToken(refreshToken);

        // Check if refresh token exists in Redis
        String storedToken = stringRedisTemplate.opsForValue().get(RedisKeys.AUTH_SESSION + userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = userMapper.selectById(userId);
        if (user == null || "BANNED".equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        // Invalidate old refresh token
        stringRedisTemplate.delete(RedisKeys.AUTH_SESSION + userId);

        return buildLoginResponse(user);
    }

    public void logout(Long userId, String accessToken) {
        // Remove refresh token from Redis
        stringRedisTemplate.delete(RedisKeys.AUTH_SESSION + userId);

        // Add access token to blacklist (until it expires)
        if (accessToken != null) {
            stringRedisTemplate.opsForValue().set(
                    RedisKeys.AUTH_BLACKLIST + accessToken,
                    "1", 2, TimeUnit.HOURS);
        }
    }

    public void sendVerificationCode(SendCodeRequest request) {
        // 验证码校验
        if (captchaService.isEnabled()) {
            if (request.getCaptchaToken() == null) {
                throw new BusinessException(400, "请完成验证码验证");
            }
            String scene = "RESET_PASSWORD".equals(request.getType()) ? "RESET_PASSWORD" : "REGISTER";
            CaptchaVerifyRequest captchaRequest = new CaptchaVerifyRequest();
            captchaRequest.setToken(request.getCaptchaToken());
            captchaRequest.setScene(scene);
            CaptchaVerifyResponse captchaResponse = captchaService.verify(captchaRequest, null, null);
            if (!captchaResponse.getSuccess()) {
                throw new BusinessException(400, "验证码验证失败");
            }
        }

        if ("REGISTER".equals(request.getType())) {
            if (userMapper.existsByEmail(request.getEmail())) {
                throw new BusinessException(ErrorCode.EMAIL_EXISTS);
            }
        } else if ("RESET_PASSWORD".equals(request.getType())) {
            if (!userMapper.existsByEmail(request.getEmail())) {
                // Don't reveal whether email exists (security best practice)
                // Silently succeed
                return;
            }
        }
        emailService.generateAndSendCode(request.getEmail(), request.getType());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!emailService.verifyCode(request.getEmail(), request.getCode(), "RESET_PASSWORD")) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID);
        }

        User user = userMapper.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        userMapper.updatePassword(user.getId(), passwordEncoder.encode(request.getNewPassword()));

        // Invalidate all sessions
        stringRedisTemplate.delete(RedisKeys.AUTH_SESSION + user.getId());

        log.info("Password reset for user: {}", user.getUsername());
    }

    public User getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    @Transactional
    public void changeEmail(Long userId, String code, String newEmail, String captchaToken) {
        // 验证码校验
        if (captchaService.isEnabled()) {
            if (captchaToken == null) {
                throw new BusinessException(400, "请完成验证码验证");
            }
            CaptchaVerifyRequest captchaRequest = new CaptchaVerifyRequest();
            captchaRequest.setToken(captchaToken);
            captchaRequest.setScene("CHANGE_EMAIL");
            CaptchaVerifyResponse captchaResponse = captchaService.verify(captchaRequest, null, userId);
            if (!captchaResponse.getSuccess()) {
                throw new BusinessException(400, "验证码验证失败");
            }
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // Verify the code was sent to the NEW email
        if (!emailService.verifyCode(newEmail, code, "CHANGE_EMAIL")) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID);
        }

        // Check if new email is already taken
        if (userMapper.existsByEmail(newEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_EXISTS);
        }

        userMapper.updateEmail(user.getId(), newEmail);

        // Invalidate all sessions so user must re-login with new email
        stringRedisTemplate.delete(RedisKeys.AUTH_SESSION + user.getId());

        log.info("Email changed for user: {} -> new email: {}", user.getUsername(),
                newEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"));
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        // 验证码校验
        if (captchaService.isEnabled()) {
            if (request.getCaptchaToken() == null) {
                throw new BusinessException(400, "请完成验证码验证");
            }
            CaptchaVerifyRequest captchaRequest = new CaptchaVerifyRequest();
            captchaRequest.setToken(request.getCaptchaToken());
            captchaRequest.setScene("CHANGE_PASSWORD");
            CaptchaVerifyResponse captchaResponse = captchaService.verify(captchaRequest, null, userId);
            if (!captchaResponse.getSuccess()) {
                throw new BusinessException(400, "验证码验证失败");
            }
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.OLD_PASSWORD_WRONG);
        }

        userMapper.updatePassword(user.getId(), passwordEncoder.encode(request.getNewPassword()));

        // Invalidate all sessions
        stringRedisTemplate.delete(RedisKeys.AUTH_SESSION + user.getId());
    }

    private LoginResponse buildLoginResponse(User user) {
        List<Role> roles = roleMapper.findRolesByUserId(user.getId());
        List<String> roleCodes = roles.stream().map(Role::getCode).collect(Collectors.toList());
        List<String> roleAuthorities = roleCodes.stream().map(c -> "ROLE_" + c).collect(Collectors.toList());

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(),
                Map.of("roles", roleAuthorities));
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

        // Store refresh token in Redis
        stringRedisTemplate.opsForValue().set(
                RedisKeys.AUTH_SESSION + user.getId(),
                refreshToken, 7, TimeUnit.DAYS);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(7200L)
                .user(LoginResponse.UserVO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .bio(user.getBio())
                        .language(user.getLanguage())
                        .emailVerified(user.getEmailVerified())
                        .roles(roleCodes)
                        .build())
                .build();
    }
}
