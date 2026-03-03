package com.ocplatform.common.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.common.entity.SystemConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Optional;

@Mapper
public interface SystemConfigMapper extends BaseMapper<SystemConfig> {

    @Select("SELECT * FROM system_configs WHERE config_key = #{key}")
    Optional<SystemConfig> findByKey(@Param("key") String key);
}
