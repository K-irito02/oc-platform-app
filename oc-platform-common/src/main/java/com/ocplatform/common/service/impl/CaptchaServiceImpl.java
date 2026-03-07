package com.ocplatform.common.service.impl;

import com.ocplatform.common.config.CaptchaConfig;
import com.ocplatform.common.dto.CaptchaVerifyRequest;
import com.ocplatform.common.dto.CaptchaVerifyResponse;
import com.ocplatform.common.entity.CaptchaRecord;
import com.ocplatform.common.repository.CaptchaRecordMapper;
import com.ocplatform.common.service.CaptchaConfigResponse;
import com.ocplatform.common.service.CaptchaService;
import com.ocplatform.common.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaptchaServiceImpl implements CaptchaService {

    private final CaptchaConfig captchaConfig;
    private final CaptchaRecordMapper captchaRecordMapper;
    private final RestTemplate restTemplate;
    private final SystemConfigService systemConfigService;

    @Value("${captcha.enabled:true}")
    private boolean captchaEnabled;

    private static final String SITE_KEY_CONFIG = "captcha.cloudflare.site_key";
    private static final String SECRET_KEY_CONFIG = "captcha.cloudflare.secret_key";
    private static final String ENABLED_CONFIG = "captcha.enabled";
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private String getSiteKey() {
        Optional<String> dbValue = systemConfigService.getConfig(SITE_KEY_CONFIG);
        if (dbValue.isPresent() && !dbValue.get().isBlank()) {
            return dbValue.get();
        }
        return captchaConfig.getSiteKey();
    }

    private String getSecretKey() {
        Optional<String> dbValue = systemConfigService.getConfig(SECRET_KEY_CONFIG);
        if (dbValue.isPresent() && !dbValue.get().isBlank()) {
            return dbValue.get();
        }
        return captchaConfig.getSecretKey();
    }

    private boolean isDbEnabled() {
        Optional<String> dbValue = systemConfigService.getConfig(ENABLED_CONFIG);
        if (dbValue.isPresent()) {
            return "true".equalsIgnoreCase(dbValue.get());
        }
        return captchaEnabled;
    }

    @Override
    public CaptchaVerifyResponse verify(CaptchaVerifyRequest request, String clientIp, Long userId) {
        CaptchaVerifyResponse response = new CaptchaVerifyResponse();
        CaptchaRecord record = CaptchaRecord.builder()
                .userId(userId)
                .ipAddress(clientIp)
                .scene(request.getScene())
                .ticket(request.getToken())
                .verifyService("cloudflare")
                .createdAt(LocalDateTime.now())
                .build();

        String secretKey = getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            log.error("验证码 Secret Key 未配置");
            response.setSuccess(false);
            response.setMessage("验证码服务未配置");
            record.setVerifyResult(false);
            record.setFailReason("Secret Key 未配置");
            captchaRecordMapper.insert(record);
            return response;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", request.getToken());
            params.add("remoteip", clientIp);

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(params, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(
                    VERIFY_URL,
                    requestEntity,
                    Map.class
            );

            if (result != null && Boolean.TRUE.equals(result.get("success"))) {
                response.setSuccess(true);
                response.setChallengeTs((String) result.get("challenge_ts"));
                response.setHostname((String) result.get("hostname"));
                record.setVerifyResult(true);
            } else {
                response.setSuccess(false);
                response.setMessage("验证失败");
                record.setVerifyResult(false);
                
                @SuppressWarnings("unchecked")
                List<String> errorCodes = (List<String>) result.get("error-codes");
                if (errorCodes != null && !errorCodes.isEmpty()) {
                    response.setErrorCodes(errorCodes);
                    record.setFailReason(String.join(", ", errorCodes));
                } else {
                    record.setFailReason("未知错误");
                }
            }
        } catch (Exception e) {
            log.error("验证码验证异常", e);
            response.setSuccess(false);
            response.setMessage("验证服务异常");
            List<String> errorCodes = new ArrayList<>();
            errorCodes.add("service-error");
            response.setErrorCodes(errorCodes);
            record.setVerifyResult(false);
            record.setFailReason(e.getMessage());
        }

        captchaRecordMapper.insert(record);
        return response;
    }

    @Override
    public boolean isEnabled() {
        if (!isDbEnabled()) {
            return false;
        }
        String siteKey = getSiteKey();
        return siteKey != null && !siteKey.isBlank();
    }

    @Override
    public CaptchaConfigResponse getConfig() {
        return new CaptchaConfigResponse(isEnabled(), getSiteKey());
    }
}
