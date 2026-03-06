package com.ocplatform.common.controller;

import com.ocplatform.common.dto.CaptchaVerifyRequest;
import com.ocplatform.common.dto.CaptchaVerifyResponse;
import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.service.CaptchaService;
import com.ocplatform.common.service.CaptchaConfigResponse;
import com.ocplatform.common.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 验证码控制器
 * 提供验证码验证和配置查询接口
 */
@RestController
@RequestMapping("/api/v1/captcha")
@RequiredArgsConstructor
public class CaptchaController {

    private final CaptchaService captchaService;

    /**
     * 验证票据
     *
     * @param request 验证请求
     * @param httpRequest HTTP请求
     * @return 验证结果
     */
    @PostMapping("/verify")
    public ApiResponse<CaptchaVerifyResponse> verify(
            @Valid @RequestBody CaptchaVerifyRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = IpUtil.getClientIp(httpRequest);
        CaptchaVerifyResponse response = captchaService.verify(request, clientIp, null);
        return ApiResponse.success(response);
    }

    /**
     * 获取验证码配置
     *
     * @return 验证码配置信息
     */
    @GetMapping("/config")
    public ApiResponse<CaptchaConfigResponse> getConfig() {
        return ApiResponse.success(captchaService.getConfig());
    }
}
