package com.qtplatform.user.service;

import com.qtplatform.common.constant.RedisKeys;
import com.qtplatform.common.exception.BusinessException;
import com.qtplatform.common.response.ErrorCode;
import com.qtplatform.user.entity.EmailVerification;
import com.qtplatform.user.repository.EmailVerificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationMapper emailVerificationMapper;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${spring.mail.username}")
    private String mailFrom;

    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRE_MINUTES = 10;

    public String generateAndSendCode(String email, String type) {
        // Rate limiting check via Redis
        String rateLimitKey = RedisKeys.VERIFY_CODE + email + ":" + type;
        String existing = stringRedisTemplate.opsForValue().get(rateLimitKey);
        if (existing != null) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_TOO_FREQUENT);
        }

        // Check hourly limit
        int recentCount = emailVerificationMapper.countRecentByEmail(email, type);
        if (recentCount >= 10) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_TOO_FREQUENT, "验证码发送次数已达上限，请稍后再试");
        }

        String code = generateCode();

        // Save to database
        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .type(type)
                .isUsed(false)
                .expiresAt(OffsetDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES))
                .build();
        emailVerificationMapper.insert(verification);

        // Set rate limit (1 minute cooldown)
        stringRedisTemplate.opsForValue().set(rateLimitKey, "1", 60, TimeUnit.SECONDS);

        // Send email asynchronously
        sendVerificationEmail(email, code, type);

        return code;
    }

    public boolean verifyCode(String email, String code, String type) {
        return emailVerificationMapper.findLatestValid(email, type)
                .filter(v -> v.getCode().equals(code))
                .map(v -> {
                    v.setIsUsed(true);
                    emailVerificationMapper.updateById(v);
                    return true;
                })
                .orElse(false);
    }

    @Async("asyncExecutor")
    public void sendVerificationEmail(String email, String code, String type) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(email);
            message.setSubject(getSubject(type));
            message.setText(getBody(code, type));
            mailSender.send(message);
            log.info("Verification email sent to {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"));
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"), e.getMessage());
        }
    }

    private String generateCode() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String getSubject(String type) {
        return switch (type) {
            case "REGISTER" -> "Qt 产品平台 - 注册验证码";
            case "RESET_PASSWORD" -> "Qt 产品平台 - 密码重置验证码";
            case "CHANGE_EMAIL" -> "Qt 产品平台 - 邮箱变更验证码";
            default -> "Qt 产品平台 - 验证码";
        };
    }

    private String getBody(String code, String type) {
        String action = switch (type) {
            case "REGISTER" -> "注册账号";
            case "RESET_PASSWORD" -> "重置密码";
            case "CHANGE_EMAIL" -> "变更邮箱";
            default -> "操作";
        };
        return String.format("您正在进行%s操作，验证码为：%s\n\n验证码 %d 分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。",
                action, code, CODE_EXPIRE_MINUTES);
    }
}
