package com.qtplatform.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileVO {

    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String bio;
    private String status;
    private String language;
    private Boolean emailVerified;
    private List<String> roles;
    private OffsetDateTime createdAt;
    private OffsetDateTime lastLoginAt;
    private String themeConfig;
}
