package com.ocplatform.common.controller;

import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PublicSystemController {

    private final SystemConfigMapper systemConfigMapper;

    @GetMapping("/system/theme")
    public ApiResponse<Map<String, String>> getGlobalTheme() {
        String themeConfig = systemConfigMapper.findByKey("theme.global.config")
                .map(SystemConfig::getConfigValue)
                .orElse("");
        return ApiResponse.success(Map.of("themeConfig", themeConfig));
    }
}
