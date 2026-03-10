package com.ocplatform.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 邮件模板服务 - 生成专业的HTML邮件模板
 * 采用蓝白极简设计，支持中英文双语，集成系统配置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailConfigService emailConfigService;

    private static final int CODE_EXPIRE_MINUTES = 10;

    /**
     * 生成验证码邮件主题
     */
    public String getSubject(String type, String locale, String code) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        String siteName = "zh".equals(locale) ? config.getSiteName() : config.getSiteNameEn();
        
        if ("zh".equals(locale)) {
            return switch (type) {
                case "REGISTER" -> siteName + " 注册验证码: " + code;
                case "RESET_PASSWORD" -> siteName + " 密码重置验证码: " + code;
                case "CHANGE_EMAIL" -> siteName + " 邮箱变更验证码: " + code;
                default -> siteName + " 验证码: " + code;
            };
        } else {
            return switch (type) {
                case "REGISTER" -> siteName + " Registration Code: " + code;
                case "RESET_PASSWORD" -> siteName + " Password Reset Code: " + code;
                case "CHANGE_EMAIL" -> siteName + " Email Change Code: " + code;
                default -> siteName + " Verification Code: " + code;
            };
        }
    }

    /**
     * 生成验证码邮件HTML内容（双语版本）
     * 采用蓝白极简设计：白色背景、蓝色主题、清晰排版
     */
    public String generateVerificationEmail(String code, String type) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        
        String actionZh = switch (type) {
            case "REGISTER" -> "注册账号";
            case "RESET_PASSWORD" -> "重置密码";
            case "CHANGE_EMAIL" -> "变更邮箱";
            default -> "操作验证";
        };
        
        String actionEn = switch (type) {
            case "REGISTER" -> "ACCOUNT REGISTRATION";
            case "RESET_PASSWORD" -> "PASSWORD RESET";
            case "CHANGE_EMAIL" -> "EMAIL CHANGE";
            default -> "VERIFICATION";
        };

        String filingText = "";
        if (config.getBeian() != null && !config.getBeian().isEmpty()) {
            filingText += config.getBeian();
        }
        if (config.getIcp() != null && !config.getIcp().isEmpty()) {
            if (!filingText.isEmpty()) filingText += " · ";
            filingText += config.getIcp();
        }
        
        String logoHtml;
        String siteLogo = config.getSiteLogo();
        
        if (siteLogo != null && !siteLogo.isEmpty() && !siteLogo.equals("null") && !siteLogo.trim().isEmpty()) {
            String logoUrl = siteLogo.trim();
            
            if (logoUrl.contains("localhost") || logoUrl.contains("127.0.0.1") || logoUrl.startsWith("http://192.168.") || logoUrl.startsWith("http://10.")) {
                String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                    ? config.getSiteName().substring(0, 1).toUpperCase() 
                    : "K";
                logoHtml = String.format(
                    "<div style=\"width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif;\">%s</div>",
                    initial
                );
            } else {
                if (!logoUrl.startsWith("http://") && !logoUrl.startsWith("https://")) {
                    String siteUrl = config.getSiteUrl();
                    if (siteUrl != null && !siteUrl.isEmpty()) {
                        logoUrl = siteUrl.replaceAll("/$", "") + logoUrl;
                    }
                }
                logoHtml = String.format(
                    "<img src=\"%s\" alt=\"%s\" width=\"40\" height=\"40\" style=\"display: block; width: 40px; height: 40px; border-radius: 8px; object-fit: cover;\" />",
                    logoUrl, config.getSiteName()
                );
            }
        } else {
            String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                ? config.getSiteName().substring(0, 1).toUpperCase() 
                : "K";
            logoHtml = String.format(
                "<div style=\"width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif;\">%s</div>",
                initial
            );
        }

        String formattedCode = code;

        String socialLinksHtml = "";
        if (config.hasAnySocialLink()) {
            StringBuilder sb = new StringBuilder();
            sb.append("<tr>");
            sb.append("<td style=\"padding: 0 32px 24px; text-align: center;\">");
            sb.append("<p style=\"margin: 0 0 12px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;\">关注我们 · Follow Us</p>");
            sb.append("<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin: 0 auto;\">");
            sb.append("<tr>");
            
            if (config.getSocialGithub() != null && !config.getSocialGithub().isEmpty()) {
                sb.append("<td style=\"padding: 0 6px;\"><a href=\"").append(config.getSocialGithub()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 32px; text-decoration: none; color: #64748b; font-size: 12px; font-weight: 600;\">GH</a></td>");
            }
            if (config.getSocialTwitter() != null && !config.getSocialTwitter().isEmpty()) {
                sb.append("<td style=\"padding: 0 6px;\"><a href=\"").append(config.getSocialTwitter()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 32px; text-decoration: none; color: #64748b; font-size: 12px; font-weight: 600;\">X</a></td>");
            }
            if (config.getSocialLinkedin() != null && !config.getSocialLinkedin().isEmpty()) {
                sb.append("<td style=\"padding: 0 6px;\"><a href=\"").append(config.getSocialLinkedin()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 32px; text-decoration: none; color: #64748b; font-size: 12px; font-weight: 600;\">IN</a></td>");
            }
            if (config.getSocialWeibo() != null && !config.getSocialWeibo().isEmpty()) {
                sb.append("<td style=\"padding: 0 6px;\"><a href=\"").append(config.getSocialWeibo()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 32px; text-decoration: none; color: #64748b; font-size: 12px; font-weight: 600;\">微</a></td>");
            }
            if (config.getSocialEmail() != null && !config.getSocialEmail().isEmpty()) {
                sb.append("<td style=\"padding: 0 6px;\"><a href=\"mailto:").append(config.getSocialEmail()).append("\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 32px; text-decoration: none; color: #64748b; font-size: 12px; font-weight: 600;\">@</a></td>");
            }
            
            sb.append("</tr>");
            sb.append("</table>");
            sb.append("</td>");
            sb.append("</tr>");
            socialLinksHtml = sb.toString();
        }

        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s · %s</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #f8fafc; line-height: 1.5; -webkit-font-smoothing: antialiased;">
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f8fafc; min-height: 100vh;">
        <tr>
            <td style="padding: 40px 16px;">
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); overflow: hidden;">
                    
                    <tr>
                        <td style="background-color: #2563eb; padding: 24px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                <tr>
                                    <td style="vertical-align: middle; width: 48px;">
                                        %s
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 12px;">
                                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;\">%s</p>
                                        <p style="margin: 2px 0 0; font-size: 11px; font-weight: 500; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.05em;\">%s</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 32px;">
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color: #eff6ff; border-radius: 6px; padding: 6px 12px;">
                                        <span style="font-size: 11px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;\">%s · %s</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; font-size: 15px; color: #334155; line-height: 1.6;">
                                您正在进行账户操作，请使用以下验证码完成身份验证。
                            </p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                Please use the following code to verify your identity.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 28px; text-align: center;">
                                        <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;\">验证码 · Verification Code</p>
                                        
                                        <p style="margin: 0; font-size: 42px; font-weight: 700; color: #2563eb; letter-spacing: 0.1em; font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; white-space: nowrap;\">%s</p>
                                        
                                        <p style="margin: 16px 0 0; font-size: 12px; color: #64748b;">
                                            <span style=\"color: #f59e0b;\">⏱</span> %d分钟内有效 · Valid for %d min
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                            <span style="color: #f59e0b;">⚠</span> %s
                                        </p>
                                        <p style="margin: 6px 0 0; font-size: 11px; color: #b45309; line-height: 1.4;">
                                            %s
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px; text-align: center;">
                            <a href="%s" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                访问官网 · Visit Website →
                            </a>
                        </td>
                    </tr>
                    
                    %s
                    
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
                                此邮件由系统自动发送，请勿直接回复<br>
                                <span style="color: #64748b;">This is an automated message. Please do not reply.</span>
                            </p>
                            
                            %s
                            
                            <p style="margin: 16px 0 0; font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 0.02em;">
                                %s
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <p style="margin: 20px 0 0; text-align: center; font-size: 10px; color: #94a3b8; letter-spacing: 0.05em;">
                    Powered by %s
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
            """.formatted(
                actionZh,
                config.getSiteName(),
                logoHtml,
                config.getSiteName(),
                config.getSiteNameEn(),
                actionZh,
                actionEn,
                formattedCode,
                CODE_EXPIRE_MINUTES,
                CODE_EXPIRE_MINUTES,
                config.getSecurityTip(),
                config.getSecurityTipEn(),
                config.getSiteUrl(),
                socialLinksHtml,
                filingText.isEmpty() ? "" : 
                    "<p style=\"margin: 0 0 8px; font-size: 10px; color: #94a3b8; text-align: center;\">" + filingText + "</p>",
                config.getCopyright() + " · " + config.getCopyrightEn(),
                config.getSiteNameEn()
            );
    }

    /**
     * 邮箱地址脱敏
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return email.charAt(0) + "***" + (atIndex > 0 ? email.substring(atIndex) : "");
        }
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        int len = localPart.length();
        String masked = localPart.charAt(0) + "***" + (len > 1 ? localPart.charAt(len - 1) : "");
        return masked + domain;
    }

    /**
     * 生成邮箱更改通知邮件主题
     */
    public String getEmailChangeNotificationSubject(boolean success, String locale) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        String siteName = "zh".equals(locale) ? config.getSiteName() : config.getSiteNameEn();
        
        if ("zh".equals(locale)) {
            return success 
                ? siteName + " 邮箱更改成功通知"
                : siteName + " 邮箱更改尝试通知";
        } else {
            return success 
                ? siteName + " Email Changed Successfully"
                : siteName + " Email Change Attempt Notification";
        }
    }

    /**
     * 生成邮箱更改通知邮件HTML内容
     */
    public String generateEmailChangeNotificationEmail(String oldEmail, String newEmail, boolean success, String reason) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        
        String maskedNewEmail = maskEmail(newEmail);
        String maskedOldEmail = maskEmail(oldEmail);
        String currentTime = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        
        String filingText = "";
        if (config.getBeian() != null && !config.getBeian().isEmpty()) {
            filingText += config.getBeian();
        }
        if (config.getIcp() != null && !config.getIcp().isEmpty()) {
            if (!filingText.isEmpty()) filingText += " · ";
            filingText += config.getIcp();
        }
        
        String logoHtml;
        String siteLogo = config.getSiteLogo();
        
        if (siteLogo != null && !siteLogo.isEmpty() && !siteLogo.equals("null") && !siteLogo.trim().isEmpty()) {
            String logoUrl = siteLogo.trim();
            if (logoUrl.contains("localhost") || logoUrl.contains("127.0.0.1") || logoUrl.startsWith("http://192.168.") || logoUrl.startsWith("http://10.")) {
                String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                    ? config.getSiteName().substring(0, 1).toUpperCase() 
                    : "K";
                logoHtml = String.format(
                    "<div style=\"width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif;\">%s</div>",
                    initial
                );
            } else {
                if (!logoUrl.startsWith("http://") && !logoUrl.startsWith("https://")) {
                    String siteUrl = config.getSiteUrl();
                    if (siteUrl != null && !siteUrl.isEmpty()) {
                        logoUrl = siteUrl.replaceAll("/$", "") + logoUrl;
                    }
                }
                logoHtml = String.format(
                    "<img src=\"%s\" alt=\"%s\" width=\"40\" height=\"40\" style=\"display: block; width: 40px; height: 40px; border-radius: 8px; object-fit: cover;\" />",
                    logoUrl, config.getSiteName()
                );
            }
        } else {
            String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                ? config.getSiteName().substring(0, 1).toUpperCase() 
                : "K";
            logoHtml = String.format(
                "<div style=\"width: 40px; height: 40px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif;\">%s</div>",
                initial
            );
        }

        String statusTagZh = success ? "更改成功" : "更改失败";
        String statusTagEn = success ? "CHANGE SUCCESSFUL" : "CHANGE FAILED";
        String statusColor = success ? "#22c55e" : "#ef4444";
        String statusBgColor = success ? "#dcfce7" : "#fee2e2";
        
        String mainContentZh;
        String mainContentEn;
        String reasonHtml = "";
        
        if (success) {
            mainContentZh = "您的账户邮箱已成功更改。";
            mainContentEn = "Your account email has been successfully changed.";
        } else {
            mainContentZh = "有人尝试更改您的账户邮箱，但操作失败。";
            mainContentEn = "Someone attempted to change your account email, but the operation failed.";
            if (reason != null && !reason.isEmpty()) {
                reasonHtml = String.format(
                    "<tr><td style=\"padding: 4px 0;\"><span style=\"color: #64748b;\">失败原因 / Reason:</span></td><td style=\"padding: 4px 0; text-align: right;\"><span style=\"color: #ef4444;\">%s</span></td></tr>",
                    reason
                );
            }
        }

        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%s · %s</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #f8fafc; line-height: 1.5; -webkit-font-smoothing: antialiased;">
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f8fafc; min-height: 100vh;">
        <tr>
            <td style="padding: 40px 16px;">
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); overflow: hidden;">
                    
                    <tr>
                        <td style="background-color: #2563eb; padding: 24px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                <tr>
                                    <td style="vertical-align: middle; width: 48px;">
                                        %s
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 12px;">
                                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;\">%s</p>
                                        <p style="margin: 2px 0 0; font-size: 11px; font-weight: 500; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.05em;\">%s</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 32px;">
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color: %s; border-radius: 6px; padding: 6px 12px;">
                                        <span style="font-size: 11px; font-weight: 600; color: %s; text-transform: uppercase; letter-spacing: 0.05em;\">%s · %s</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; font-size: 15px; color: #334155; line-height: 1.6;">
                                %s
                            </p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                %s
                            </p>
                            
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr><td style="padding: 4px 0;\"><span style="color: #64748b;\">原邮箱 / Old Email:</span></td><td style="padding: 4px 0; text-align: right;\"><span style="color: #334155; font-family: 'SF Mono', monospace; font-size: 13px;\">%s</span></td></tr>
                                            <tr><td style="padding: 4px 0;\"><span style="color: #64748b;\">新邮箱 / New Email:</span></td><td style="padding: 4px 0; text-align: right;\"><span style="color: #334155; font-family: 'SF Mono', monospace; font-size: 13px;\">%s</span></td></tr>
                                            <tr><td style="padding: 4px 0;\"><span style="color: #64748b;\">时间 / Time:</span></td><td style="padding: 4px 0; text-align: right;\"><span style="color: #334155; font-size: 13px;\">%s</span></td></tr>
                                            %s
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                            <span style="color: #f59e0b;">⚠</span> 如果这不是您本人的操作，请立即联系管理员。
                                        </p>
                                        <p style="margin: 6px 0 0; font-size: 11px; color: #b45309; line-height: 1.4;">
                                            If this was not you, please contact the administrator immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 32px 32px; text-align: center;">
                            <a href="%s" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                访问官网 · Visit Website →
                            </a>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
                                此邮件由系统自动发送，请勿直接回复<br>
                                <span style="color: #64748b;">This is an automated message. Please do not reply.</span>
                            </p>
                            
                            %s
                            
                            <p style="margin: 16px 0 0; font-size: 10px; color: #94a3b8; text-align: center; letter-spacing: 0.02em;">
                                %s
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <p style="margin: 20px 0 0; text-align: center; font-size: 10px; color: #94a3b8; letter-spacing: 0.05em;">
                    Powered by %s
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
            """.formatted(
                statusTagZh,
                config.getSiteName(),
                logoHtml,
                config.getSiteName(),
                config.getSiteNameEn(),
                statusBgColor,
                statusColor,
                statusTagZh,
                statusTagEn,
                mainContentZh,
                mainContentEn,
                maskedOldEmail,
                maskedNewEmail,
                currentTime,
                reasonHtml,
                config.getSiteUrl(),
                filingText.isEmpty() ? "" : 
                    "<p style=\"margin: 0 0 8px; font-size: 10px; color: #94a3b8; text-align: center;\">" + filingText + "</p>",
                config.getCopyright() + " · " + config.getCopyrightEn(),
                config.getSiteNameEn()
            );
    }
}
