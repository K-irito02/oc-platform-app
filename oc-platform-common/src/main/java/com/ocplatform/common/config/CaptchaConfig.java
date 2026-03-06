package com.ocplatform.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "captcha.cloudflare")
public class CaptchaConfig {

    private String siteKey;
    private String secretKey;
    private String verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private Integer timeout = 5000;
}
