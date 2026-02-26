package com.qtplatform.common.controller;

import com.qtplatform.common.entity.SystemConfig;
import com.qtplatform.common.repository.SystemConfigMapper;
import com.qtplatform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class PublicSystemController {

    private final SystemConfigMapper systemConfigMapper;

    @GetMapping("/theme")
    public ApiResponse<Map<String, String>> getGlobalTheme() {
        String themeConfig = systemConfigMapper.findByKey("theme.global.config")
                .map(SystemConfig::getConfigValue)
                .orElse("");
        return ApiResponse.success(Map.of("themeConfig", themeConfig));
    }
}
