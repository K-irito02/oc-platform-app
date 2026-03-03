package com.ocplatform.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName(value = "audit_logs", autoResultMap = true)
public class AuditLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String action;
    private String targetType;
    private Long targetId;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> detail;

    private String ipAddress;
    private OffsetDateTime createdAt;
}
