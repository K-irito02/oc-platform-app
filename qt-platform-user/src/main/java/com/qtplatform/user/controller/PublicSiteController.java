package com.qtplatform.user.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qtplatform.common.entity.SystemConfig;
import com.qtplatform.common.repository.SystemConfigMapper;
import com.qtplatform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicSiteController {

    private final SystemConfigMapper systemConfigMapper;

    @GetMapping("/site-config")
    public ApiResponse<Map<String, Object>> getSiteConfig() {
        List<SystemConfig> configs = systemConfigMapper.selectList(
            new LambdaQueryWrapper<SystemConfig>()
                .in(SystemConfig::getConfigKey, 
                    "site.name", "site.name_en", "site.description", "site.logo",
                    "register.enabled", "comment.auto_approve", "upload.max_file_size")
        );

        Map<String, Object> result = new HashMap<>();
        for (SystemConfig config : configs) {
            String key = config.getConfigKey();
            String value = config.getConfigValue();
            
            switch (key) {
                case "site.name":
                    result.put("siteName", value);
                    break;
                case "site.name_en":
                    result.put("siteNameEn", value);
                    break;
                case "site.description":
                    result.put("siteDescription", value);
                    break;
                case "site.logo":
                    result.put("siteLogo", value);
                    break;
                case "register.enabled":
                    result.put("registerEnabled", "true".equalsIgnoreCase(value));
                    break;
                case "comment.auto_approve":
                    result.put("commentAutoApprove", "true".equalsIgnoreCase(value));
                    break;
                case "upload.max_file_size":
                    try {
                        result.put("uploadMaxFileSize", Long.parseLong(value));
                    } catch (NumberFormatException e) {
                        result.put("uploadMaxFileSize", 1073741824L);
                    }
                    break;
            }
        }

        // Set defaults if not found
        result.putIfAbsent("siteName", "KiritoLab");
        result.putIfAbsent("siteNameEn", "KiritoLab");
        result.putIfAbsent("siteDescription", "");
        result.putIfAbsent("siteLogo", "");
        result.putIfAbsent("registerEnabled", true);
        result.putIfAbsent("commentAutoApprove", false);
        result.putIfAbsent("uploadMaxFileSize", 1073741824L);

        return ApiResponse.success(result);
    }
}
