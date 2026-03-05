package com.ocplatform.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceConfigDTO {

    private Boolean enabled;

    @NotBlank(message = "维护标题不能为空")
    private String title;

    @NotBlank(message = "维护标题（英文）不能为空")
    private String titleEn;

    @NotBlank(message = "维护说明不能为空")
    private String message;

    @NotBlank(message = "维护说明（英文）不能为空")
    private String messageEn;

    private OffsetDateTime estimatedTime;
}
