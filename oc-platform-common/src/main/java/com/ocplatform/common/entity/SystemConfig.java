package com.ocplatform.common.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("system_configs")
public class SystemConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("config_key")
    private String configKey;
    
    @TableField("config_value")
    private String configValue;
    
    private String description;
    private Long updatedBy;
    private OffsetDateTime updatedAt;
}
