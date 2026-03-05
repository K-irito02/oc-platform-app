package com.ocplatform.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceStatusDTO {

    private Boolean enabled;
    private String title;
    private String titleEn;
    private String message;
    private String messageEn;
    private OffsetDateTime estimatedTime;
}
