package com.ocplatform.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/system")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminSystemController {

    private final SystemConfigMapper systemConfigMapper;

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
}
