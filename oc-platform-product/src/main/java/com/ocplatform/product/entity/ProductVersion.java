package com.ocplatform.product.entity;

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
@TableName("product_versions")
public class ProductVersion {

    @TableId(type = IdType.AUTO)
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
    private String filePath;
    private String fileUrl;
    private String checksumMd5;
    private String checksumSha256;
    private String signature;
    private Long fileRecordId;  // 关联的文件记录ID，用于下载
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
