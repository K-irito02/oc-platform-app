package com.ocplatform.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.admin.service.FilingService;
import com.ocplatform.common.dto.FilingConfigDTO;
import com.ocplatform.common.dto.MaintenanceConfigDTO;
import com.ocplatform.common.dto.MaintenanceStatusDTO;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.event.MaintenanceCacheClearEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/system")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminSystemController {

    private final SystemConfigMapper systemConfigMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final FilingService filingService;

    private static final String CONFIG_ENABLED = "system.maintenance.enabled";
    private static final String CONFIG_TITLE = "system.maintenance.title";
    private static final String CONFIG_TITLE_EN = "system.maintenance.title_en";
    private static final String CONFIG_MESSAGE = "system.maintenance.message";
    private static final String CONFIG_MESSAGE_EN = "system.maintenance.message_en";
    private static final String CONFIG_ESTIMATED_TIME = "system.maintenance.estimated_time";

    @GetMapping("/configs")
    public ApiResponse<List<SystemConfig>> getAllConfigs() {
        return ApiResponse.success(systemConfigMapper.selectList(
                new LambdaQueryWrapper<SystemConfig>().orderByAsc(SystemConfig::getConfigKey)));
    }

    @PutMapping("/configs/{key}")
    public ApiResponse<Void> updateConfig(@PathVariable String key,
                                          @RequestBody Map<String, String> body,
                                          Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        systemConfigMapper.findByKey(key).ifPresent(config -> {
            config.setConfigValue(body.get("value"));
            config.setUpdatedBy(userId);
            systemConfigMapper.updateById(config);
        });
        return ApiResponse.success();
    }

    @GetMapping("/theme")
    public ApiResponse<Map<String, String>> getGlobalTheme() {
        String themeConfig = systemConfigMapper.findByKey("theme.global.config")
                .map(SystemConfig::getConfigValue)
                .orElse("");
        return ApiResponse.success(Map.of("themeConfig", themeConfig));
    }

    @PutMapping("/theme")
    public ApiResponse<Void> updateGlobalTheme(@RequestBody Map<String, String> body,
                                               Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String themeConfig = body.get("themeConfig");
        systemConfigMapper.findByKey("theme.global.config").ifPresentOrElse(
            config -> {
                config.setConfigValue(themeConfig);
                config.setUpdatedBy(userId);
                systemConfigMapper.updateById(config);
            },
            () -> {
                SystemConfig newConfig = new SystemConfig();
                newConfig.setConfigKey("theme.global.config");
                newConfig.setConfigValue(themeConfig);
                newConfig.setDescription("全局主题配置");
                newConfig.setUpdatedBy(userId);
                systemConfigMapper.insert(newConfig);
            }
        );
        return ApiResponse.success();
    }

    @GetMapping("/maintenance")
    public ApiResponse<MaintenanceStatusDTO> getMaintenanceConfig() {
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

    @PutMapping("/maintenance")
    public ApiResponse<Void> updateMaintenanceConfig(@RequestBody MaintenanceConfigDTO dto,
                                                     Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        updateOrCreateConfig(CONFIG_ENABLED, String.valueOf(dto.getEnabled()), "系统维护模式开关", userId);
        updateOrCreateConfig(CONFIG_TITLE, dto.getTitle(), "维护页面标题", userId);
        updateOrCreateConfig(CONFIG_TITLE_EN, dto.getTitleEn(), "维护页面标题（英文）", userId);
        updateOrCreateConfig(CONFIG_MESSAGE, dto.getMessage(), "维护说明", userId);
        updateOrCreateConfig(CONFIG_MESSAGE_EN, dto.getMessageEn(), "维护说明（英文）", userId);
        
        if (dto.getEstimatedTime() != null) {
            updateOrCreateConfig(CONFIG_ESTIMATED_TIME, dto.getEstimatedTime().toString(), "预计恢复时间", userId);
        } else {
            updateOrCreateConfig(CONFIG_ESTIMATED_TIME, "", "预计恢复时间", userId);
        }

        eventPublisher.publishEvent(new MaintenanceCacheClearEvent(this));

        return ApiResponse.success();
    }

    @PostMapping("/filing/send-code")
    public ApiResponse<Void> sendFilingCode() {
        filingService.sendFilingVerificationCode();
        return ApiResponse.success();
    }

    @GetMapping("/filing")
    public ApiResponse<Map<String, String>> getFilingConfig() {
        Map<String, String> result = new HashMap<>();
        result.put("icp", getConfigValue("footer.icp", ""));
        result.put("policeBeian", getConfigValue("footer.beian", ""));
        result.put("policeIconUrl", getConfigValue("footer.police_icon_url", ""));
        result.put("superAdminEmail", maskEmail(filingService.getSuperAdminEmail()));
        return ApiResponse.success(result);
    }

    @PutMapping("/filing")
    public ApiResponse<Void> updateFilingConfig(@Valid @RequestBody FilingConfigDTO dto,
                                                 Authentication authentication) {
        if (!filingService.verifyCode(dto.getVerificationCode())) {
            throw new BusinessException(ErrorCode.VERIFICATION_CODE_INVALID, "验证码错误或已过期");
        }
        
        Long userId = (Long) authentication.getPrincipal();
        filingService.updateFilingConfig(dto.getIcp(), dto.getPoliceBeian(), dto.getPoliceIconUrl(), userId);
        
        return ApiResponse.success();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        String[] parts = email.split("@");
        String localPart = parts[0];
        String domain = parts[1];
        if (localPart.length() <= 3) {
            return localPart.charAt(0) + "***@" + domain;
        }
        return localPart.substring(0, 3) + "***@" + domain;
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

    private void updateOrCreateConfig(String key, String value, String description, Long userId) {
        systemConfigMapper.findByKey(key).ifPresentOrElse(
            config -> {
                config.setConfigValue(value);
                config.setUpdatedBy(userId);
                systemConfigMapper.updateById(config);
            },
            () -> {
                SystemConfig newConfig = new SystemConfig();
                newConfig.setConfigKey(key);
                newConfig.setConfigValue(value);
                newConfig.setDescription(description);
                newConfig.setUpdatedBy(userId);
                systemConfigMapper.insert(newConfig);
            }
        );
    }
}
