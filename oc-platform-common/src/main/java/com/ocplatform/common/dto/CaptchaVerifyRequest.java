package com.ocplatform.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaVerifyRequest {

    @NotBlank(message = "验证令牌不能为空")
    private String token;

    @NotBlank(message = "验证场景不能为空")
    private String scene;
}
