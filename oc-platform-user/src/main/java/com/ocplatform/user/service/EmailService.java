package com.ocplatform.user.service;

import com.ocplatform.common.constant.RedisKeys;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.user.entity.EmailVerification;
import com.ocplatform.user.repository.EmailVerificationMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.concurrent.Executor;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationMapper emailVerificationMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final Executor asyncExecutor;
    private final EmailTemplateService emailTemplateService;

    @Value("${spring.mail.username}")
    private String mailFrom;

    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRE_MINUTES = 10;

    public String generateAndSendCode(String email, String type) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.error("Email service not configured: MAIL_USERNAME is empty");
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "邮件服务未配置，请联系管理员");
        }
        
        String normalizedEmail = email.toLowerCase().trim();
        
        String rateLimitKey = RedisKeys.VERIFY_CODE + normalizedEmail + ":" + type;
        String existing = stringRedisTemplate.opsForValue().get(rateLimitKey);
        if (existing != null) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_TOO_FREQUENT);
        }

        int recentCount = emailVerificationMapper.countRecentByEmail(normalizedEmail, type);
        if (recentCount >= 10) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_TOO_FREQUENT, "验证码发送次数已达上限，请稍后再试");
        }

        String code = generateCode();

        EmailVerification verification = EmailVerification.builder()
                .email(normalizedEmail)
                .code(code)
                .type(type)
                .isUsed(false)
                .expiresAt(OffsetDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES))
                .build();
        emailVerificationMapper.insert(verification);

        stringRedisTemplate.opsForValue().set(rateLimitKey, "1", 60, TimeUnit.SECONDS);

        log.info("Verification code generated for {} (type: {})", 
                normalizedEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), type);

        asyncExecutor.execute(() -> sendVerificationEmailInternal(normalizedEmail, code, type));

        return code;
    }

    public boolean verifyCode(String email, String code, String type) {
        // Normalize email for lookup
        String normalizedEmail = email.toLowerCase().trim();
        
        log.info("Verifying code for email: {}, type: {}, code: {}", 
                normalizedEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), type, code);
        
        Optional<EmailVerification> verification = emailVerificationMapper.findLatestValid(normalizedEmail, type);
        
        if (verification.isEmpty()) {
            log.warn("No valid verification found for email: {}, type: {}", 
                    normalizedEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), type);
            return false;
        }
        
        EmailVerification v = verification.get();
        log.info("Found verification record: id={}, email={}, code={}, expires_at={}", 
                v.getId(), v.getEmail().replaceAll("(?<=.{2}).(?=.*@)", "*"), v.getCode(), v.getExpiresAt());
        
        if (!v.getCode().equals(code)) {
            log.warn("Code mismatch: expected={}, provided={}", v.getCode(), code);
            return false;
        }
        
        v.setIsUsed(true);
        emailVerificationMapper.updateById(v);
        log.info("Verification successful for email: {}", normalizedEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"));
        return true;
    }

    private void sendVerificationEmailInternal(String email, String code, String type) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.error("Email service not configured: MAIL_USERNAME is empty");
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "邮件服务未配置，请联系管理员");
        }
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(mailFrom);
            helper.setTo(email);
            helper.setSubject(emailTemplateService.getSubject(type, "zh", code));
            helper.setText(emailTemplateService.generateVerificationEmail(code, type), true);
            
            mailSender.send(mimeMessage);
            log.info("Verification email sent to {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"));
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"), e.getMessage());
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "邮件发送失败，请稍后重试");
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"), e.getMessage());
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "邮件发送失败，请稍后重试");
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

    /**
     * 发送邮箱更改通知到旧邮箱
     * @param oldEmail 旧邮箱
     * @param newEmail 新邮箱
     * @param success 是否成功
     * @param reason 失败原因（如果失败）
     */
    public void sendEmailChangeNotification(String oldEmail, String newEmail, boolean success, String reason) {
        if (mailFrom == null || mailFrom.isBlank()) {
            log.error("Email service not configured: MAIL_USERNAME is empty");
            return;
        }
        
        asyncExecutor.execute(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                
                helper.setFrom(mailFrom);
                helper.setTo(oldEmail.toLowerCase().trim());
                helper.setSubject(emailTemplateService.getEmailChangeNotificationSubject(success, "zh"));
                helper.setText(emailTemplateService.generateEmailChangeNotificationEmail(oldEmail, newEmail, success, reason), true);
                
                mailSender.send(mimeMessage);
                log.info("Email change notification sent to {} (success: {})", 
                        oldEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), success);
            } catch (MessagingException e) {
                log.error("Failed to send email change notification to {}: {}", 
                        oldEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), e.getMessage());
            } catch (Exception e) {
                log.error("Unexpected error sending email change notification to {}: {}", 
                        oldEmail.replaceAll("(?<=.{2}).(?=.*@)", "*"), e.getMessage());
            }
        });
    }

    private String getSubject(String type) {
        return switch (type) {
            case "REGISTER" -> "【Qt 产品平台】注册验证码";
            case "RESET_PASSWORD" -> "【Qt 产品平台】密码重置验证码";
            case "CHANGE_EMAIL" -> "【Qt 产品平台】邮箱变更验证码";
            default -> "【Qt 产品平台】验证码";
        };
    }

    private String getHtmlBody(String code, String type) {
        String action = switch (type) {
            case "REGISTER" -> "注册账号";
            case "RESET_PASSWORD" -> "重置密码";
            case "CHANGE_EMAIL" -> "变更邮箱";
            default -> "操作";
        };
        
        String actionEn = switch (type) {
            case "REGISTER" -> "Account Registration";
            case "RESET_PASSWORD" -> "Password Reset";
            case "CHANGE_EMAIL" -> "Email Change";
            default -> "Operation";
        };

        return """
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>验证码 - Qt 产品平台</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f5f5f5;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
                                        <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 28px; color: #ffffff; font-weight: bold; line-height: 64px;">Qt</span>
                                        </div>
                                        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Qt 产品平台</h1>
                                        <p style="margin: 8px 0 0; font-size: 14px; color: #666666;">Qt Product Platform</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 32px 40px;">
                                        <p style="margin: 0 0 8px; font-size: 16px; color: #333333; font-weight: 500;">您好！Hello!</p>
                                        <p style="margin: 0 0 24px; font-size: 14px; color: #666666; line-height: 1.6;">
                                            您正在进行 <strong style="color: #1a1a1a;">%s</strong> 操作，请使用以下验证码完成验证：<br>
                                            <span style="color: #999999; font-size: 12px;">You are performing <strong>%s</strong>. Please use the following code:</span>
                                        </p>
                                        
                                        <!-- Verification Code Box -->
                                        <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                                            <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px;">验证码 Verification Code</p>
                                            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">%s</p>
                                        </div>
                                        
                                        <!-- Copy hint -->
                                        <p style="margin: 0 0 24px; font-size: 13px; color: #999999; text-align: center;">
                                            💡 点击上方验证码可直接复制 / Click the code above to copy
                                        </p>
                                        
                                        <!-- Warning -->
                                        <div style="background-color: #fff8e6; border-left: 4px solid #faad14; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                                            <p style="margin: 0; font-size: 14px; color: #ad6800; line-height: 1.6;">
                                                ⏰ 验证码 <strong>%d 分钟</strong>内有效，请勿泄露给他人。<br>
                                                <span style="font-size: 12px; color: #d48806;">Valid for %d minutes. Do not share with others.</span>
                                            </p>
                                        </div>
                                        
                                        <p style="margin: 24px 0 0; font-size: 13px; color: #999999; line-height: 1.6;">
                                            如果这不是您本人的操作，请忽略此邮件。您的账户仍然安全。<br>
                                            <span style="font-size: 12px;">If you didn't request this, please ignore this email. Your account is still secure.</span>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px 32px; border-top: 1px solid #f0f0f0; text-align: center;">
                                        <p style="margin: 0 0 8px; font-size: 12px; color: #999999;">
                                            此邮件由系统自动发送，请勿直接回复。<br>
                                            This is an automated message, please do not reply.
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #cccccc;">
                                            © 2026 Qt Product Platform. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(action, actionEn, code, CODE_EXPIRE_MINUTES, CODE_EXPIRE_MINUTES);
    }
}
