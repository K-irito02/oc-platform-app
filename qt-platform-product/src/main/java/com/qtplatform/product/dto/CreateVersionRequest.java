package com.qtplatform.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateVersionRequest {

    @NotBlank(message = "版本号不能为空")
    private String versionNumber;

    private String versionType; // ALPHA, BETA, RC, RELEASE

    @NotBlank(message = "平台不能为空")
    private String platform; // WINDOWS, LINUX, MACOS

    private String architecture; // x86, x64, arm64

    private String minOsVersion;

    @NotBlank(message = "文件名不能为空")
    private String fileName;

    @NotNull(message = "文件大小不能为空")
    private Long fileSize;

    @NotBlank(message = "文件路径不能为空")
    private String filePath;

    @NotBlank(message = "SHA256 校验码不能为空")
    private String checksumSha256;

    private String checksumMd5;
    private String signature;
    private Long fileRecordId;  // 关联的文件记录ID
    private Boolean isMandatory;
    private Integer rolloutPercentage;
    private String releaseNotes;
    private String releaseNotesEn;
}
