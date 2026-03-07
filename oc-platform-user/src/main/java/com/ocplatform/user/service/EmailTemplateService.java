package com.ocplatform.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 邮件模板服务 - 生成专业的HTML邮件模板
 * 采用极简工业风设计，支持中英文双语，集成系统配置
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
    public String getSubject(String type, String locale) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        String siteName = "zh".equals(locale) ? config.getSiteName() : config.getSiteNameEn();
        
        if ("zh".equals(locale)) {
            return switch (type) {
                case "REGISTER" -> "【" + siteName + "】注册验证码";
                case "RESET_PASSWORD" -> "【" + siteName + "】密码重置验证码";
                case "CHANGE_EMAIL" -> "【" + siteName + "】邮箱变更验证码";
                default -> "【" + siteName + "】验证码";
            };
        } else {
            return switch (type) {
                case "REGISTER" -> "[" + siteName + "] Registration Verification Code";
                case "RESET_PASSWORD" -> "[" + siteName + "] Password Reset Verification Code";
                case "CHANGE_EMAIL" -> "[" + siteName + "] Email Change Verification Code";
                default -> "[" + siteName + "] Verification Code";
            };
        }
    }

    /**
     * 生成验证码邮件HTML内容（双语版本）
     * 采用极简工业风设计：深色主题、粗体排版、几何元素
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

        // 构建备案信息
        String filingText = "";
        if (config.getBeian() != null && !config.getBeian().isEmpty()) {
            filingText += config.getBeian();
        }
        if (config.getIcp() != null && !config.getIcp().isEmpty()) {
            if (!filingText.isEmpty()) filingText += " · ";
            filingText += config.getIcp();
        }
        
        // Logo HTML - 智能判断是否使用图片Logo
        String logoHtml;
        String siteLogo = config.getSiteLogo();
        
        if (siteLogo != null && !siteLogo.isEmpty() && !siteLogo.equals("null") && !siteLogo.trim().isEmpty()) {
            String logoUrl = siteLogo.trim();
            
            // 检查是否为开发环境的本地URL
            if (logoUrl.contains("localhost") || logoUrl.contains("127.0.0.1") || logoUrl.startsWith("http://192.168.") || logoUrl.startsWith("http://10.")) {
                // 开发环境：使用文字Logo
                String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                    ? config.getSiteName().substring(0, 1).toUpperCase() 
                    : "K";
                logoHtml = String.format(
                    "<div style=\"width: 48px; height: 48px; background: #0f172a; border: 2px solid #2dd4bf; border-radius: 8px; display: inline-block; text-align: center; line-height: 44px; font-size: 22px; font-weight: 800; color: #2dd4bf; font-family: 'JetBrains Mono', 'SF Mono', monospace;\">%s</div>",
                    initial
                );
            } else {
                // 生产环境或可访问的URL：使用图片Logo
                if (!logoUrl.startsWith("http://") && !logoUrl.startsWith("https://")) {
                    String siteUrl = config.getSiteUrl();
                    if (siteUrl != null && !siteUrl.isEmpty()) {
                        logoUrl = siteUrl.replaceAll("/$", "") + logoUrl;
                    }
                }
                logoHtml = String.format(
                    "<img src=\"%s\" alt=\"%s\" width=\"48\" height=\"48\" style=\"display: block; width: 48px; height: 48px; border-radius: 8px; border: 2px solid #2dd4bf; object-fit: cover;\" />",
                    logoUrl, config.getSiteName()
                );
            }
        } else {
            // 无Logo配置：使用文字Logo
            String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                ? config.getSiteName().substring(0, 1).toUpperCase() 
                : "K";
            logoHtml = String.format(
                "<div style=\"width: 48px; height: 48px; background: #0f172a; border: 2px solid #2dd4bf; border-radius: 8px; display: inline-block; text-align: center; line-height: 44px; font-size: 22px; font-weight: 800; color: #2dd4bf; font-family: 'JetBrains Mono', 'SF Mono', monospace;\">%s</div>",
                initial
            );
        }

        // 验证码不分组，一行显示全部数字
        String formattedCode = code;

        // 构建社交链接HTML
        String socialLinksHtml = "";
        if (config.hasAnySocialLink()) {
            StringBuilder sb = new StringBuilder();
            sb.append("<tr>");
            sb.append("<td style=\"padding: 0 32px 24px; text-align: center;\">");
            sb.append("<p style=\"margin: 0 0 12px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;\">关注我们 · Follow Us</p>");
            sb.append("<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin: 0 auto;\">");
            sb.append("<tr>");
            
            if (config.getSocialGithub() != null && !config.getSocialGithub().isEmpty()) {
                sb.append("<td style=\"padding: 0 8px;\"><a href=\"").append(config.getSocialGithub()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #334155; border-radius: 4px; text-align: center; line-height: 32px; text-decoration: none; color: #94a3b8; font-size: 14px;\">GH</a></td>");
            }
            if (config.getSocialTwitter() != null && !config.getSocialTwitter().isEmpty()) {
                sb.append("<td style=\"padding: 0 8px;\"><a href=\"").append(config.getSocialTwitter()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #334155; border-radius: 4px; text-align: center; line-height: 32px; text-decoration: none; color: #94a3b8; font-size: 14px;\">X</a></td>");
            }
            if (config.getSocialLinkedin() != null && !config.getSocialLinkedin().isEmpty()) {
                sb.append("<td style=\"padding: 0 8px;\"><a href=\"").append(config.getSocialLinkedin()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #334155; border-radius: 4px; text-align: center; line-height: 32px; text-decoration: none; color: #94a3b8; font-size: 14px;\">IN</a></td>");
            }
            if (config.getSocialWeibo() != null && !config.getSocialWeibo().isEmpty()) {
                sb.append("<td style=\"padding: 0 8px;\"><a href=\"").append(config.getSocialWeibo()).append("\" target=\"_blank\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #334155; border-radius: 4px; text-align: center; line-height: 32px; text-decoration: none; color: #94a3b8; font-size: 14px;\">微</a></td>");
            }
            if (config.getSocialEmail() != null && !config.getSocialEmail().isEmpty()) {
                sb.append("<td style=\"padding: 0 8px;\"><a href=\"mailto:").append(config.getSocialEmail()).append("\" style=\"display: inline-block; width: 32px; height: 32px; background-color: #334155; border-radius: 4px; text-align: center; line-height: 32px; text-decoration: none; color: #94a3b8; font-size: 14px;\">@</a></td>");
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #0f172a; line-height: 1.5; -webkit-font-smoothing: antialiased;">
    
    <!-- 主容器 -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #0f172a; min-height: 100vh;">
        <tr>
            <td style="padding: 40px 16px;">
                
                <!-- 邮件卡片 -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 480px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 4px;">
                    
                    <!-- 顶部装饰线 -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(90deg, #2dd4bf 0%%, #22d3ee 50%%, #3b82f6 100%%);"></td>
                    </tr>
                    
                    <!-- 头部区域 -->
                    <tr>
                        <td style="padding: 32px 32px 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                <tr>
                                    <td style="vertical-align: middle; width: 56px;">
                                        %s
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 16px;">
                                        <p style="margin: 0; font-size: 20px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.02em;">%s</p>
                                        <p style="margin: 2px 0 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">%s</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 分隔线 -->
                    <tr>
                        <td style="padding: 0 32px;">
                            <div style="height: 1px; background-color: #334155;"></div>
                        </td>
                    </tr>
                    
                    <!-- 主内容区域 -->
                    <tr>
                        <td style="padding: 28px 32px;">
                            
                            <!-- 操作类型标签 -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color: #134e4a; border: 1px solid #2dd4bf; border-radius: 2px; padding: 4px 10px;">
                                        <span style="font-size: 11px; font-weight: 600; color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.08em;">%s · %s</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- 问候语 -->
                            <p style="margin: 20px 0 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                                您正在进行账户操作，请使用以下验证码完成身份验证。
                            </p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                Please use the following code to verify your identity.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- 验证码区域 -->
                    <tr>
                        <td style="padding: 0 32px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 28px; text-align: center;">
                                        <!-- 验证码标签 -->
                                        <p style="margin: 0 0 12px; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em;">VERIFICATION CODE</p>
                                        
                                        <!-- 验证码数字 -->
                                        <p style="margin: 0; font-size: 42px; font-weight: 800; color: #2dd4bf; letter-spacing: 0.08em; font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace; white-space: nowrap;">%s</p>
                                        
                                        <!-- 有效期 -->
                                        <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">
                                            <span style="color: #f59e0b;">⏱</span> %d分钟内有效 · Valid for %d min
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 安全提示 -->
                    <tr>
                        <td style="padding: 0 32px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #1c1917; border-left: 3px solid #f59e0b; border-radius: 0 4px 4px 0;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #a8a29e; line-height: 1.5;">
                                            <span style="color: #f59e0b;">⚠</span> %s
                                        </p>
                                        <p style="margin: 6px 0 0; font-size: 11px; color: #78716c; line-height: 1.4;">
                                            %s
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 访问官网按钮 -->
                    <tr>
                        <td style="padding: 0 32px 32px; text-align: center;">
                            <a href="%s" target="_blank" style="display: inline-block; background-color: #2dd4bf; color: #0f172a; text-decoration: none; padding: 12px 28px; border-radius: 2px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                                访问官网 · Visit Website →
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 社交链接 -->
                    %s
                    
                    <!-- 底部区域 -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155;">
                            <!-- 自动发送提示 -->
                            <p style="margin: 0 0 12px; font-size: 11px; color: #475569; text-align: center; line-height: 1.5;">
                                此邮件由系统自动发送，请勿直接回复<br>
                                <span style="color: #64748b;">This is an automated message. Please do not reply.</span>
                            </p>
                            
                            <!-- 备案信息 -->
                            %s
                            
                            <!-- 版权信息 -->
                            <p style="margin: 16px 0 0; font-size: 10px; color: #334155; text-align: center; letter-spacing: 0.02em;">
                                %s
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- 底部品牌 -->
                <p style="margin: 20px 0 0; text-align: center; font-size: 10px; color: #334155; letter-spacing: 0.1em; text-transform: uppercase;">
                    Powered by %s
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
            """.formatted(
                actionZh,                                // title action zh
                config.getSiteName(),                    // title site name
                logoHtml,                                // logo
                config.getSiteName(),                    // site name zh
                config.getSiteNameEn(),                  // site name en
                actionZh,                                // action tag zh
                actionEn,                                // action tag en
                formattedCode,                           // verification code
                CODE_EXPIRE_MINUTES,                     // expire minutes zh
                CODE_EXPIRE_MINUTES,                     // expire minutes en
                config.getSecurityTip(),                 // security tip zh
                config.getSecurityTipEn(),               // security tip en
                config.getSiteUrl(),                     // website url
                socialLinksHtml,                         // social links
                filingText.isEmpty() ? "" : 
                    "<p style=\"margin: 0 0 8px; font-size: 10px; color: #475569; text-align: center;\">" + filingText + "</p>",
                config.getCopyright() + " · " + config.getCopyrightEn(),
                config.getSiteNameEn()                   // powered by
            );
    }

    /**
     * 邮箱地址脱敏
     * 例如：user@example.com -> u***r@example.com
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
                ? "【" + siteName + "】邮箱更改成功通知"
                : "【" + siteName + "】邮箱更改尝试通知";
        } else {
            return success 
                ? "[" + siteName + "] Email Changed Successfully"
                : "[" + siteName + "] Email Change Attempt Notification";
        }
    }

    /**
     * 生成邮箱更改通知邮件HTML内容
     * @param oldEmail 原邮箱
     * @param newEmail 新邮箱
     * @param success 是否成功
     * @param reason 失败原因（如果失败）
     */
    public String generateEmailChangeNotificationEmail(String oldEmail, String newEmail, boolean success, String reason) {
        EmailConfigService.EmailTemplateConfig config = emailConfigService.getEmailConfig();
        
        String maskedNewEmail = maskEmail(newEmail);
        String maskedOldEmail = maskEmail(oldEmail);
        String currentTime = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        
        // 构建备案信息
        String filingText = "";
        if (config.getBeian() != null && !config.getBeian().isEmpty()) {
            filingText += config.getBeian();
        }
        if (config.getIcp() != null && !config.getIcp().isEmpty()) {
            if (!filingText.isEmpty()) filingText += " · ";
            filingText += config.getIcp();
        }
        
        // Logo HTML
        String logoHtml;
        String siteLogo = config.getSiteLogo();
        
        if (siteLogo != null && !siteLogo.isEmpty() && !siteLogo.equals("null") && !siteLogo.trim().isEmpty()) {
            String logoUrl = siteLogo.trim();
            if (logoUrl.contains("localhost") || logoUrl.contains("127.0.0.1") || logoUrl.startsWith("http://192.168.") || logoUrl.startsWith("http://10.")) {
                String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                    ? config.getSiteName().substring(0, 1).toUpperCase() 
                    : "K";
                logoHtml = String.format(
                    "<div style=\"width: 48px; height: 48px; background: #0f172a; border: 2px solid #2dd4bf; border-radius: 8px; display: inline-block; text-align: center; line-height: 44px; font-size: 22px; font-weight: 800; color: #2dd4bf; font-family: 'JetBrains Mono', 'SF Mono', monospace;\">%s</div>",
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
                    "<img src=\"%s\" alt=\"%s\" width=\"48\" height=\"48\" style=\"display: block; width: 48px; height: 48px; border-radius: 8px; border: 2px solid #2dd4bf; object-fit: cover;\" />",
                    logoUrl, config.getSiteName()
                );
            }
        } else {
            String initial = config.getSiteName() != null && !config.getSiteName().isEmpty() 
                ? config.getSiteName().substring(0, 1).toUpperCase() 
                : "K";
            logoHtml = String.format(
                "<div style=\"width: 48px; height: 48px; background: #0f172a; border: 2px solid #2dd4bf; border-radius: 8px; display: inline-block; text-align: center; line-height: 44px; font-size: 22px; font-weight: 800; color: #2dd4bf; font-family: 'JetBrains Mono', 'SF Mono', monospace;\">%s</div>",
                initial
            );
        }

        // 根据成功/失败生成不同内容
        String statusTagZh = success ? "更改成功" : "更改失败";
        String statusTagEn = success ? "CHANGE SUCCESSFUL" : "CHANGE FAILED";
        String statusColor = success ? "#22c55e" : "#ef4444";
        String statusBgColor = success ? "#14532d" : "#7f1d1d";
        
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
                    "<tr><td style=\"padding: 4px 0;\"><span style=\"color: #94a3b8;\">失败原因 / Reason:</span></td><td style=\"padding: 4px 0; text-align: right;\"><span style=\"color: #f87171;\">%s</span></td></tr>",
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background-color: #0f172a; line-height: 1.5; -webkit-font-smoothing: antialiased;">
    
    <!-- 主容器 -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #0f172a; min-height: 100vh;">
        <tr>
            <td style="padding: 40px 16px;">
                
                <!-- 邮件卡片 -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="max-width: 480px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 4px;">
                    
                    <!-- 顶部装饰线 -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(90deg, #2dd4bf 0%%, #22d3ee 50%%, #3b82f6 100%%);"></td>
                    </tr>
                    
                    <!-- 头部区域 -->
                    <tr>
                        <td style="padding: 32px 32px 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                <tr>
                                    <td style="vertical-align: middle; width: 56px;">
                                        %s
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 16px;">
                                        <p style="margin: 0; font-size: 20px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.02em;">%s</p>
                                        <p style="margin: 2px 0 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">%s</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 分隔线 -->
                    <tr>
                        <td style="padding: 0 32px;">
                            <div style="height: 1px; background-color: #334155;"></div>
                        </td>
                    </tr>
                    
                    <!-- 主内容区域 -->
                    <tr>
                        <td style="padding: 28px 32px;">
                            
                            <!-- 状态标签 -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="background-color: %s; border: 1px solid %s; border-radius: 2px; padding: 4px 10px;">
                                        <span style="font-size: 11px; font-weight: 600; color: %s; text-transform: uppercase; letter-spacing: 0.08em;">%s · %s</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- 通知内容 -->
                            <p style="margin: 20px 0 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                                %s
                            </p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                %s
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- 详情区域 -->
                    <tr>
                        <td style="padding: 0 32px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 4px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%">
                                            <tr><td style="padding: 4px 0;"><span style="color: #94a3b8;">原邮箱 / Old Email:</span></td><td style="padding: 4px 0; text-align: right;"><span style="color: #f1f5f9; font-family: 'JetBrains Mono', monospace; font-size: 13px;">%s</span></td></tr>
                                            <tr><td style="padding: 4px 0;"><span style="color: #94a3b8;">新邮箱 / New Email:</span></td><td style="padding: 4px 0; text-align: right;"><span style="color: #f1f5f9; font-family: 'JetBrains Mono', monospace; font-size: 13px;">%s</span></td></tr>
                                            <tr><td style="padding: 4px 0;"><span style="color: #94a3b8;">时间 / Time:</span></td><td style="padding: 4px 0; text-align: right;"><span style="color: #f1f5f9; font-size: 13px;">%s</span></td></tr>
                                            %s
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 安全提示 -->
                    <tr>
                        <td style="padding: 0 32px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #1c1917; border-left: 3px solid #f59e0b; border-radius: 0 4px 4px 0;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #a8a29e; line-height: 1.5;">
                                            <span style="color: #f59e0b;">⚠</span> 如果这不是您本人的操作，请立即联系管理员。
                                        </p>
                                        <p style="margin: 6px 0 0; font-size: 11px; color: #78716c; line-height: 1.4;">
                                            If this was not you, please contact the administrator immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- 访问官网按钮 -->
                    <tr>
                        <td style="padding: 0 32px 32px; text-align: center;">
                            <a href="%s" target="_blank" style="display: inline-block; background-color: #2dd4bf; color: #0f172a; text-decoration: none; padding: 12px 28px; border-radius: 2px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                                访问官网 · Visit Website →
                            </a>
                        </td>
                    </tr>
                    
                    <!-- 底部区域 -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155;">
                            <!-- 自动发送提示 -->
                            <p style="margin: 0 0 12px; font-size: 11px; color: #475569; text-align: center; line-height: 1.5;">
                                此邮件由系统自动发送，请勿直接回复<br>
                                <span style="color: #64748b;">This is an automated message. Please do not reply.</span>
                            </p>
                            
                            <!-- 备案信息 -->
                            %s
                            
                            <!-- 版权信息 -->
                            <p style="margin: 16px 0 0; font-size: 10px; color: #334155; text-align: center; letter-spacing: 0.02em;">
                                %s
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- 底部品牌 -->
                <p style="margin: 20px 0 0; text-align: center; font-size: 10px; color: #334155; letter-spacing: 0.1em; text-transform: uppercase;">
                    Powered by %s
                </p>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
            """.formatted(
                statusTagZh,                             // title status zh
                config.getSiteName(),                    // title site name
                logoHtml,                                // logo
                config.getSiteName(),                    // site name zh
                config.getSiteNameEn(),                  // site name en
                statusBgColor,                           // status tag bg color
                statusColor,                             // status tag border color
                statusColor,                             // status tag text color
                statusTagZh,                             // status tag zh
                statusTagEn,                             // status tag en
                mainContentZh,                           // main content zh
                mainContentEn,                           // main content en
                maskedOldEmail,                          // old email masked
                maskedNewEmail,                          // new email masked
                currentTime,                             // current time
                reasonHtml,                              // reason html (if failed)
                config.getSiteUrl(),                     // website url
                filingText.isEmpty() ? "" : 
                    "<p style=\"margin: 0 0 8px; font-size: 10px; color: #475569; text-align: center;\">" + filingText + "</p>",
                config.getCopyright() + " · " + config.getCopyrightEn(),
                config.getSiteNameEn()                   // powered by
            );
    }
}
