package com.ocplatform.product.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.product.dto.PlatformConfigVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformConfigService {

    private final SystemConfigMapper systemConfigMapper;
    private final ObjectMapper objectMapper;

    private static final String PLATFORM_CONFIG_KEY = "platform_config";

    public PlatformConfigVO getPlatformConfig() {
        SystemConfig config = systemConfigMapper.findByKey(PLATFORM_CONFIG_KEY)
                .orElse(null);
        
        if (config == null) {
            return getDefaultPlatformConfig();
        }
        
        try {
            return objectMapper.readValue(config.getConfigValue(), PlatformConfigVO.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse platform config", e);
            return getDefaultPlatformConfig();
        }
    }

    @Transactional
    public void updatePlatformConfig(PlatformConfigVO config) {
        try {
            String configValue = objectMapper.writeValueAsString(config);
            
            SystemConfig existingConfig = systemConfigMapper.findByKey(PLATFORM_CONFIG_KEY)
                    .orElse(null);
            
            if (existingConfig != null) {
                existingConfig.setConfigValue(configValue);
                existingConfig.setUpdatedAt(OffsetDateTime.now());
                systemConfigMapper.updateById(existingConfig);
            } else {
                SystemConfig newConfig = SystemConfig.builder()
                        .configKey(PLATFORM_CONFIG_KEY)
                        .configValue(configValue)
                        .description("平台和架构配置")
                        .updatedAt(OffsetDateTime.now())
                        .build();
                systemConfigMapper.insert(newConfig);
            }
            
            log.info("Platform config updated successfully");
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize platform config", e);
            throw new RuntimeException("Failed to update platform config", e);
        }
    }

    private SystemConfig getDefaultConfig() {
        return SystemConfig.builder()
                .configKey(PLATFORM_CONFIG_KEY)
                .configValue(getDefaultConfigJson())
                .description("平台和架构配置")
                .build();
    }

    private PlatformConfigVO getDefaultPlatformConfig() {
        try {
            return objectMapper.readValue(getDefaultConfigJson(), PlatformConfigVO.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse default platform config", e);
            return PlatformConfigVO.builder().build();
        }
    }

    private String getDefaultConfigJson() {
        return """
            {
              "platforms": [
                {"value": "WINDOWS", "label": "Windows", "labelEn": "Windows", "icon": "🪟", "architectures": ["x86", "x64", "arm64"], "enabled": true, "sortOrder": 1},
                {"value": "MACOS", "label": "macOS", "labelEn": "macOS", "icon": "🍎", "architectures": ["x64", "arm64", "universal"], "enabled": true, "sortOrder": 2},
                {"value": "LINUX", "label": "Linux", "labelEn": "Linux", "icon": "🐧", "architectures": ["x86", "x64", "arm64"], "enabled": true, "sortOrder": 3},
                {"value": "ANDROID", "label": "Android", "labelEn": "Android", "icon": "🤖", "architectures": ["arm64", "x86", "x64"], "enabled": true, "sortOrder": 4},
                {"value": "IOS", "label": "iOS", "labelEn": "iOS", "icon": "📱", "architectures": ["arm64", "x64"], "enabled": true, "sortOrder": 5},
                {"value": "WEB", "label": "Web", "labelEn": "Web", "icon": "🌐", "architectures": ["universal"], "enabled": true, "sortOrder": 6},
                {"value": "CROSS_PLATFORM", "label": "跨平台", "labelEn": "Cross Platform", "icon": "🔄", "architectures": ["universal"], "enabled": true, "sortOrder": 7}
              ],
              "architectures": [
                {"value": "x86", "label": "x86 (32位)", "labelEn": "x86 (32-bit)"},
                {"value": "x64", "label": "x64 (64位)", "labelEn": "x64 (64-bit)"},
                {"value": "arm64", "label": "ARM64", "labelEn": "ARM64"},
                {"value": "universal", "label": "通用", "labelEn": "Universal"}
              ],
              "allowCustomPlatform": true,
              "allowCustomArchitecture": true
            }
            """;
    }
}
