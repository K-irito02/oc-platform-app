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
public class FilingConfigDTO {

    @NotBlank(message = "验证码不能为空")
    private String verificationCode;

    private String icp;

    private String policeBeian;

    private String policeIconUrl;
}
