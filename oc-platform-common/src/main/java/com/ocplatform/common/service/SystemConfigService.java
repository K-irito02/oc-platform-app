package com.ocplatform.common.service;

import java.util.Optional;

/**
 * 系统配置服务接口
 * 提供系统配置的读取和设置功能
 */
public interface SystemConfigService {

    /**
     * 获取字符串配置值
     * 如果配置不存在，返回默认值
     *
     * @param key 配置键
     * @param defaultValue 默认值
     * @return 配置值或默认值
     */
    String getConfig(String key, String defaultValue);

    /**
     * 获取可选配置值
     *
     * @param key 配置键
     * @return 配置值的 Optional 包装
     */
    Optional<String> getConfig(String key);

    /**
     * 设置配置值
     * 需要管理员权限
     *
     * @param key 配置键
     * @param value 配置值
     */
    void setConfig(String key, String value);
}
