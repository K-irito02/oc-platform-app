package com.ocplatform.common.service;

import com.ocplatform.common.dto.CaptchaVerifyRequest;
import com.ocplatform.common.dto.CaptchaVerifyResponse;

public interface CaptchaService {

    /**
     * 验证票据
     */
    CaptchaVerifyResponse verify(CaptchaVerifyRequest request, String clientIp, Long userId);

    /**
     * 检查是否启用验证码
     */
    boolean isEnabled();

    /**
     * 获取验证码配置
     */
    CaptchaConfigResponse getConfig();
}
