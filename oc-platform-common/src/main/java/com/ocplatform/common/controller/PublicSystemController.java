package com.ocplatform.common.controller;

import com.ocplatform.common.dto.MaintenanceStatusDTO;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PublicSystemController {

    private final SystemConfigMapper systemConfigMapper;

    private static final String CONFIG_ENABLED = "system.maintenance.enabled";
    private static final String CONFIG_TITLE = "system.maintenance.title";
    private static final String CONFIG_TITLE_EN = "system.maintenance.title_en";
    private static final String CONFIG_MESSAGE = "system.maintenance.message";
    private static final String CONFIG_MESSAGE_EN = "system.maintenance.message_en";
    private static final String CONFIG_ESTIMATED_TIME = "system.maintenance.estimated_time";

    @GetMapping("/system/theme")
    public ApiResponse<Map<String, String>> getGlobalTheme() {
        String themeConfig = systemConfigMapper.findByKey("theme.global.config")
                .map(SystemConfig::getConfigValue)
                .orElse("");
        return ApiResponse.success(Map.of("themeConfig", themeConfig));
    }

    @GetMapping("/public/system/maintenance")
    public ApiResponse<MaintenanceStatusDTO> getMaintenanceStatus() {
        MaintenanceStatusDTO status = MaintenanceStatusDTO.builder()
                .enabled(getConfigValueAsBoolean(CONFIG_ENABLED, false))
                .title(getConfigValue(CONFIG_TITLE, "系统维护中"))
                .titleEn(getConfigValue(CONFIG_TITLE_EN, "Under Maintenance"))
                .message(getConfigValue(CONFIG_MESSAGE, "系统正在进行升级维护，请稍后再试。"))
                .messageEn(getConfigValue(CONFIG_MESSAGE_EN, "The system is under maintenance. Please try again later."))
                .estimatedTime(getConfigValueAsDateTime(CONFIG_ESTIMATED_TIME))
                .build();
        return ApiResponse.success(status);
    }

    private String getConfigValue(String key, String defaultValue) {
        return systemConfigMapper.findByKey(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    private boolean getConfigValueAsBoolean(String key, boolean defaultValue) {
        return systemConfigMapper.findByKey(key)
                .map(config -> "true".equalsIgnoreCase(config.getConfigValue()))
                .orElse(defaultValue);
    }

    private OffsetDateTime getConfigValueAsDateTime(String key) {
        return systemConfigMapper.findByKey(key)
                .map(config -> {
                    String value = config.getConfigValue();
                    if (value != null && !value.isEmpty()) {
                        try {
                            return OffsetDateTime.parse(value);
                        } catch (Exception e) {
                            return null;
                        }
                    }
                    return null;
                })
                .orElse(null);
    }
}
