package com.ocplatform.common.service.impl;

import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.service.SystemConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 系统配置服务实现类
 * 使用 ConcurrentHashMap 实现本地缓存，缓存有效期 5 分钟
 */
@Slf4j
@Service
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigMapper systemConfigMapper;

    /**
     * 配置缓存
     * Key: 配置键
     * Value: 缓存条目（包含值和过期时间）
     */
    private final Map<String, CacheEntry> configCache = new ConcurrentHashMap<>();

    /**
     * 缓存过期时间（分钟）
     */
    private static final long CACHE_EXPIRE_MINUTES = 5;

    /**
     * 定时清理过期缓存
     */
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public SystemConfigServiceImpl(SystemConfigMapper systemConfigMapper) {
        this.systemConfigMapper = systemConfigMapper;
        // 启动定时清理任务，每分钟清理一次过期缓存
        scheduler.scheduleAtFixedRate(this::cleanExpiredCache, 1, 1, TimeUnit.MINUTES);
    }

    @Override
    public String getConfig(String key, String defaultValue) {
        Optional<String> value = getConfig(key);
        return value.orElse(defaultValue);
    }

    @Override
    public Optional<String> getConfig(String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }

        // 先从缓存获取
        CacheEntry cachedEntry = configCache.get(key);
        if (cachedEntry != null && !cachedEntry.isExpired()) {
            log.debug("从缓存获取配置: key={}, value={}", key, cachedEntry.getValue());
            return Optional.of(cachedEntry.getValue());
        }

        // 缓存未命中或已过期，从数据库获取
        Optional<SystemConfig> configOptional = systemConfigMapper.findByKey(key);
        
        if (configOptional.isPresent()) {
            SystemConfig config = configOptional.get();
            // 更新缓存
            configCache.put(key, new CacheEntry(config.getConfigValue()));
            log.debug("从数据库获取配置并缓存: key={}, value={}", key, config.getConfigValue());
            return Optional.of(config.getConfigValue());
        }

        // 数据库中不存在，返回空
        log.debug("配置不存在: key={}", key);
        return Optional.empty();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void setConfig(String key, String value) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("配置键不能为空");
        }

        // 查询现有配置
        Optional<SystemConfig> existingConfig = systemConfigMapper.findByKey(key);

        if (existingConfig.isPresent()) {
            // 更新现有配置
            SystemConfig config = existingConfig.get();
            config.setConfigValue(value);
            config.setUpdatedAt(OffsetDateTime.now());
            systemConfigMapper.updateById(config);
            log.info("更新系统配置: key={}, value={}", key, value);
        } else {
            // 创建新配置
            SystemConfig newConfig = SystemConfig.builder()
                    .configKey(key)
                    .configValue(value)
                    .updatedAt(OffsetDateTime.now())
                    .build();
            systemConfigMapper.insert(newConfig);
            log.info("创建系统配置: key={}, value={}", key, value);
        }

        // 清除缓存
        configCache.remove(key);
        log.debug("清除配置缓存: key={}", key);
    }

    /**
     * 清理过期缓存
     */
    private void cleanExpiredCache() {
        int removedCount = 0;
        for (Map.Entry<String, CacheEntry> entry : configCache.entrySet()) {
            if (entry.getValue().isExpired()) {
                configCache.remove(entry.getKey());
                removedCount++;
            }
        }
        if (removedCount > 0) {
            log.debug("清理过期缓存: count={}", removedCount);
        }
    }

    /**
     * 缓存条目
     */
    private static class CacheEntry {
        private final String value;
        private final long expireTime;

        public CacheEntry(String value) {
            this.value = value;
            this.expireTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(CACHE_EXPIRE_MINUTES);
        }

        public String getValue() {
            return value;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
}
