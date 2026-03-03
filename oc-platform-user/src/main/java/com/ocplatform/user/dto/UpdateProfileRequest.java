package com.ocplatform.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "用户名长度为 3-50 个字符")
    @Pattern(regexp = "^[a-zA-Z0-9_-]*$", message = "用户名只能包含字母、数字、下划线和连字符")
    private String username;

    @Size(max = 500, message = "简介长度不能超过 500 个字符")
    private String bio;

    private String avatarUrl;

    private String themeConfig;
}
