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
@TableName("email_verifications")
public class EmailVerification {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String email;
    private String code;
    private String type;
    private Boolean isUsed;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
