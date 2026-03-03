package com.ocplatform.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVersionVO {

    private Long id;
    private Long productId;
    private String versionNumber;
    private Integer versionCode;
    private String versionType;
    private String platform;
    private String architecture;
    private String minOsVersion;
    private String fileName;
    private Long fileSize;
    private String checksumSha256;
    private Long fileRecordId;
    private Long downloadCount;
    private Boolean isMandatory;
    private Boolean isLatest;
    private String releaseNotes;
    private String releaseNotesEn;
    private String status;
    private Integer rolloutPercentage;
    private OffsetDateTime createdAt;
    private OffsetDateTime publishedAt;
}
