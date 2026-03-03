package com.ocplatform.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocplatform.common.constant.RedisKeys;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.util.JwtUtil;
import com.ocplatform.user.dto.LoginResponse;
import com.ocplatform.user.entity.Role;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.entity.UserOauthBinding;
import com.ocplatform.user.entity.UserRole;
import com.ocplatform.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final UserOauthBindingMapper oauthBindingMapper;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${oauth.github.client-id:}")
    private String githubClientId;

    @Value("${oauth.github.client-secret:}")
    private String githubClientSecret;

    @Value("${oauth.github.redirect-uri:http://localhost:5173/oauth/github/callback}")
    private String githubRedirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getGithubAuthUrl() {
        return "https://github.com/login/oauth/authorize" +
                "?client_id=" + githubClientId +
                "&redirect_uri=" + githubRedirectUri +
                "&scope=user:email";
    }

    @Transactional
    public LoginResponse handleGithubCallback(String code) {
        // 1. Exchange code for access token
        String accessToken = exchangeGithubToken(code);

        // 2. Get GitHub user info
        JsonNode githubUser = getGithubUserInfo(accessToken);
        String githubId = githubUser.get("id").asText();
        String githubUsername = githubUser.has("login") ? githubUser.get("login").asText() : null;
        String githubAvatar = githubUser.has("avatar_url") ? githubUser.get("avatar_url").asText() : null;
        String githubEmail = getGithubPrimaryEmail(accessToken);

        // 3. Check if binding exists
        var existingBinding = oauthBindingMapper.findByProviderAndOauthId("GITHUB", githubId);

        User user;
        if (existingBinding.isPresent()) {
            // Existing user - update binding info
            UserOauthBinding binding = existingBinding.get();
            binding.setOauthUsername(githubUsername);
            binding.setOauthAvatar(githubAvatar);
            binding.setAccessToken(accessToken);
            oauthBindingMapper.updateById(binding);

            user = userMapper.selectById(binding.getUserId());
            if (user == null || !"ACTIVE".equals(user.getStatus())) {
                throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
            }
        } else {
            // New user - check if email exists
            if (githubEmail != null) {
                var existingUser = userMapper.findByEmail(githubEmail);
                if (existingUser.isPresent()) {
                    // Link to existing account
                    user = existingUser.get();
                } else {
                    // Create new user
                    user = createUserFromGithub(githubUsername, githubEmail, githubAvatar);
                }
            } else {
                // No email from GitHub, create with generated email
                String generatedEmail = "github_" + githubId + "@OcPlatform.local";
                user = createUserFromGithub(githubUsername, generatedEmail, githubAvatar);
            }

            // Create binding
            oauthBindingMapper.insert(UserOauthBinding.builder()
                    .userId(user.getId())
                    .oauthProvider("GITHUB")
                    .oauthId(githubId)
                    .oauthUsername(githubUsername)
                    .oauthAvatar(githubAvatar)
                    .accessToken(accessToken)
                    .build());
        }

        return buildLoginResponse(user);
    }

    public void bindOAuth(Long userId, String provider, String code) {
        if (!"GITHUB".equals(provider)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不支持的登录方式");
        }

        var existing = oauthBindingMapper.findByUserIdAndProvider(userId, provider);
        if (existing.isPresent()) {
            throw new BusinessException(ErrorCode.OAUTH_bindING_EXISTS, "已绑定该平台账号");
        }

        String accessToken = exchangeGithubToken(code);
        JsonNode githubUser = getGithubUserInfo(accessToken);
        String githubId = githubUser.get("id").asText();

        var otherBinding = oauthBindingMapper.findByProviderAndOauthId(provider, githubId);
        if (otherBinding.isPresent()) {
            throw new BusinessException(ErrorCode.OAUTH_bindING_EXISTS);
        }

        oauthBindingMapper.insert(UserOauthBinding.builder()
                .userId(userId)
                .oauthProvider(provider)
                .oauthId(githubId)
                .oauthUsername(githubUser.has("login") ? githubUser.get("login").asText() : null)
                .oauthAvatar(githubUser.has("avatar_url") ? githubUser.get("avatar_url").asText() : null)
                .accessToken(accessToken)
                .build());
    }

    public void unbindOAuth(Long userId, String provider) {
        var binding = oauthBindingMapper.findByUserIdAndProvider(userId, provider)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "未绑定该平台账号"));

        // Ensure user has password before unbinding (can still login)
        User user = userMapper.selectById(userId);
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先设置密码后再解绑");
        }

        oauthBindingMapper.deleteById(binding.getId());
    }

    private String exchangeGithubToken(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, String> body = Map.of(
                    "client_id", githubClientId,
                    "client_secret", githubClientSecret,
                    "code", code,
                    "redirect_uri", githubRedirectUri
            );

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://github.com/login/oauth/access_token", entity, String.class);

            JsonNode node = objectMapper.readTree(response.getBody());
            if (node.has("error")) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED, "GitHub 授权失败: " + node.get("error_description").asText());
            }
            return node.get("access_token").asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("GitHub token exchange failed", e);
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "GitHub 授权失败");
        }
    }

    private JsonNode getGithubUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user", HttpMethod.GET, entity, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Failed to get GitHub user info", e);
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "获取 GitHub 用户信息失败");
        }
    }

    private String getGithubPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user/emails", HttpMethod.GET, entity, String.class);
            JsonNode emails = objectMapper.readTree(response.getBody());

            for (JsonNode email : emails) {
                if (email.get("primary").asBoolean() && email.get("verified").asBoolean()) {
                    return email.get("email").asText();
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to get GitHub email", e);
            return null;
        }
    }

    private User createUserFromGithub(String githubUsername, String email, String avatarUrl) {
        // Generate unique username
        String username = githubUsername;
        int suffix = 1;
        while (userMapper.existsByUsername(username)) {
            username = githubUsername + "_" + suffix++;
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .avatarUrl(avatarUrl)
                .status("ACTIVE")
                .language("zh-CN")
                .emailVerified(email != null && !email.endsWith("@OcPlatform.local"))
                .build();
        userMapper.insert(user);

        Role userRole = roleMapper.findByCode("USER")
                .orElseThrow(() -> new BusinessException(ErrorCode.UNKNOWN_ERROR));
        userRoleMapper.insert(UserRole.builder()
                .userId(user.getId())
                .roleId(userRole.getId())
                .build());

        return user;
    }

    private LoginResponse buildLoginResponse(User user) {
        List<Role> roles = roleMapper.findRolesByUserId(user.getId());
        List<String> roleCodes = roles.stream().map(Role::getCode).collect(Collectors.toList());
        List<String> roleAuthorities = roleCodes.stream().map(c -> "ROLE_" + c).collect(Collectors.toList());

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(),
                Map.of("roles", roleAuthorities));
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

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
