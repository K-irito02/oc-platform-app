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
@TableName("delta_updates")
public class DeltaUpdate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;
    private Long fromVersionId;
    private Long toVersionId;
    private String platform;
    private String architecture;
    private String fileName;
    private Long fileSize;
    private String filePath;
    private String checksumSha256;
    private OffsetDateTime createdAt;
}
