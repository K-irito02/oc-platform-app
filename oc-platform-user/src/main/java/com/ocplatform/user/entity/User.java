package com.ocplatform.user.entity;

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
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;
    private String email;
    private String passwordHash;
    private String avatarUrl;
    private String bio;
    private String status;
    private String language;
    private Boolean emailVerified;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime lastLoginAt;
    
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private String lastLoginIp;

    @TableField("theme_config")
    private String themeConfig;
}
