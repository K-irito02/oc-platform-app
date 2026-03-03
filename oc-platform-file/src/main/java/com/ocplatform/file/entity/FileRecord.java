package com.ocplatform.file.entity;

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
@TableName("file_records")
public class FileRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String originalName;
    private String storedName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String checksumSha256;
    private String storageType;
    private String bucketName;
    private String fileUrl;
    private Long uploadedBy;
    private OffsetDateTime createdAt;
}
