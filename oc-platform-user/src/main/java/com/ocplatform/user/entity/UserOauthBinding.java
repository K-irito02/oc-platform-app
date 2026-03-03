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
@TableName("user_oauth_bindings")
public class UserOauthBinding {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String oauthProvider;
    private String oauthId;
    private String oauthUsername;
    private String oauthAvatar;
    private String accessToken;
    private String refreshToken;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
