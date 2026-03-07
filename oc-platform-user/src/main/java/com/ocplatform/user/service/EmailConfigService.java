package com.ocplatform.user.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 邮件配置服务 - 从系统配置中获取邮件相关配置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailConfigService {

    private final SystemConfigMapper systemConfigMapper;

    /**
     * 获取邮件模板所需的所有配置
     */
    public EmailTemplateConfig getEmailConfig() {
        List<SystemConfig> configs = systemConfigMapper.selectList(
            new LambdaQueryWrapper<SystemConfig>()
                .likeRight(SystemConfig::getConfigKey, "site.")
                .or()
                .likeRight(SystemConfig::getConfigKey, "email.")
                .or()
                .likeRight(SystemConfig::getConfigKey, "footer.")
                .or()
                .likeRight(SystemConfig::getConfigKey, "social.")
        );

        Map<String, String> configMap = new HashMap<>();
        for (SystemConfig config : configs) {
            configMap.put(config.getConfigKey(), config.getConfigValue());
        }

        return EmailTemplateConfig.builder()
                // 站点信息
                .siteName(configMap.getOrDefault("site.name", "桐人创研"))
                .siteNameEn(configMap.getOrDefault("site.name_en", "KirLab"))
                .siteUrl(configMap.getOrDefault("site.url", "https://kiritolab.com"))
                .siteLogo(configMap.getOrDefault("site.logo", ""))
                // 邮件发件人
                .senderName(configMap.getOrDefault("email.sender_name", "桐人创研"))
                .senderNameEn(configMap.getOrDefault("email.sender_name_en", "KirLab"))
                // 版权信息
                .copyright(configMap.getOrDefault("email.copyright", "© 2026 桐人创研. 保留所有权利."))
                .copyrightEn(configMap.getOrDefault("email.copyright_en", "© 2026 KirLab. All rights reserved."))
                // 安全提示
                .securityTip(configMap.getOrDefault("email.security_tip", "如果这不是您本人的操作，请忽略此邮件。您的账户仍然安全。"))
                .securityTipEn(configMap.getOrDefault("email.security_tip_en", "If you did not request this, please ignore this email. Your account is still secure."))
                // 备案信息
                .beian(configMap.getOrDefault("footer.beian", ""))
                .beianEn(configMap.getOrDefault("footer.beian_en", ""))
                .icp(configMap.getOrDefault("footer.icp", ""))
                .icpEn(configMap.getOrDefault("footer.icp_en", ""))
                // 社交链接
                .socialGithub(configMap.getOrDefault("social.github", ""))
                .socialTwitter(configMap.getOrDefault("social.twitter", ""))
                .socialLinkedin(configMap.getOrDefault("social.linkedin", ""))
                .socialWeibo(configMap.getOrDefault("social.weibo", ""))
                .socialWechat(configMap.getOrDefault("social.wechat", ""))
                .socialEmail(configMap.getOrDefault("social.email", ""))
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EmailTemplateConfig {
        private String siteName;
        private String siteNameEn;
        private String siteUrl;
        private String siteLogo;
        private String senderName;
        private String senderNameEn;
        private String copyright;
        private String copyrightEn;
        private String securityTip;
        private String securityTipEn;
        private String beian;
        private String beianEn;
        private String icp;
        private String icpEn;
        // 社交链接
        private String socialGithub;
        private String socialTwitter;
        private String socialLinkedin;
        private String socialWeibo;
        private String socialWechat;
        private String socialEmail;
        
        public boolean hasAnySocialLink() {
            return (socialGithub != null && !socialGithub.isEmpty()) ||
                   (socialTwitter != null && !socialTwitter.isEmpty()) ||
                   (socialLinkedin != null && !socialLinkedin.isEmpty()) ||
                   (socialWeibo != null && !socialWeibo.isEmpty()) ||
                   (socialWechat != null && !socialWechat.isEmpty()) ||
                   (socialEmail != null && !socialEmail.isEmpty());
        }
    }
}
