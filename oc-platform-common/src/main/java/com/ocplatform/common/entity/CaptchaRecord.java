package com.ocplatform.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("captcha_records")
public class CaptchaRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String ipAddress;
    private String scene;
    private String ticket;
    private String verifyService;
    private Boolean verifyResult;
    private Integer evilLevel;
    private String failReason;
    private LocalDateTime createdAt;
}
