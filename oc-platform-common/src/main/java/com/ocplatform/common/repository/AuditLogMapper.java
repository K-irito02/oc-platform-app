package com.ocplatform.common.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.common.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
