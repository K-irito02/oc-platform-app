package com.ocplatform.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocplatform.common.dto.MaintenanceStatusDTO;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaintenanceInterceptor implements HandlerInterceptor {

    private final SystemConfigMapper systemConfigMapper;
    private final ObjectMapper objectMapper;

    private static final List<String> WHITELIST_PATHS = List.of(
            "/api/v1/admin",
            "/api/v1/auth/login",
            "/api/v1/public/system/maintenance",
            "/api/v1/public/site-config"
    );

    private static final String CONFIG_ENABLED = "system.maintenance.enabled";
    private static final String CONFIG_TITLE = "system.maintenance.title";
    private static final String CONFIG_TITLE_EN = "system.maintenance.title_en";
    private static final String CONFIG_MESSAGE = "system.maintenance.message";
    private static final String CONFIG_MESSAGE_EN = "system.maintenance.message_en";
    private static final String CONFIG_ESTIMATED_TIME = "system.maintenance.estimated_time";

    private final ConcurrentHashMap<String, CachedConfig> configCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 30000;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestPath = request.getRequestURI();

        if (isWhitelisted(requestPath)) {
            return true;
        }

        MaintenanceStatusDTO status = getMaintenanceStatus();
        
        if (Boolean.TRUE.equals(status.getEnabled())) {
            sendMaintenanceResponse(response, status);
            return false;
        }

        return true;
    }

    private boolean isWhitelisted(String path) {
        return WHITELIST_PATHS.stream().anyMatch(path::startsWith);
    }

    private MaintenanceStatusDTO getMaintenanceStatus() {
        long now = System.currentTimeMillis();
        
        CachedConfig cached = configCache.get("maintenance");
        if (cached != null && now - cached.timestamp < CACHE_TTL_MS) {
            return cached.status;
        }

        MaintenanceStatusDTO status = fetchMaintenanceStatusFromDB();
        configCache.put("maintenance", new CachedConfig(status, now));
        
        return status;
    }

    private MaintenanceStatusDTO fetchMaintenanceStatusFromDB() {
        MaintenanceStatusDTO.MaintenanceStatusDTOBuilder builder = MaintenanceStatusDTO.builder();
        
        builder.enabled(getConfigValueAsBoolean(CONFIG_ENABLED, false));
        builder.title(getConfigValue(CONFIG_TITLE, "系统维护中"));
        builder.titleEn(getConfigValue(CONFIG_TITLE_EN, "Under Maintenance"));
        builder.message(getConfigValue(CONFIG_MESSAGE, "系统正在进行升级维护，请稍后再试。"));
        builder.messageEn(getConfigValue(CONFIG_MESSAGE_EN, "The system is under maintenance. Please try again later."));
        
        String estimatedTimeStr = getConfigValue(CONFIG_ESTIMATED_TIME, null);
        if (estimatedTimeStr != null && !estimatedTimeStr.isEmpty()) {
            try {
                builder.estimatedTime(OffsetDateTime.parse(estimatedTimeStr));
            } catch (Exception e) {
                log.warn("Failed to parse estimated time: {}", estimatedTimeStr);
            }
        }

        return builder.build();
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

    private void sendMaintenanceResponse(HttpServletResponse response, MaintenanceStatusDTO status) throws IOException {
        response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        ApiResponse<MaintenanceStatusDTO> apiResponse = ApiResponse.<MaintenanceStatusDTO>builder()
                .code(ErrorCode.MAINTENANCE_MODE.getCode())
                .message(ErrorCode.MAINTENANCE_MODE.getMessage())
                .data(status)
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    public void clearCache() {
        configCache.clear();
    }

    private record CachedConfig(MaintenanceStatusDTO status, long timestamp) {}
}
