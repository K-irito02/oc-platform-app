package com.ocplatform.product.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.ocplatform.common.handler.JsonbTypeHandler;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName(value = "products", autoResultMap = true)
public class Product {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private String nameEn;
    private String slug;
    private String description;
    private String descriptionEn;
    private Long categoryId;
    private Long developerId;
    private String status;
    private String iconUrl;
    private String bannerUrl;

    @TableField(typeHandler = JsonbTypeHandler.class)
    private List<String> screenshots;

    private String demoVideoUrl;
    private String homepageUrl;
    private String sourceUrl;
    private String license;
    private Long downloadCount;
    private BigDecimal ratingAverage;
    private Integer ratingCount;

    @TableField(typeHandler = com.ocplatform.common.handler.JsonbMapTypeHandler.class)
    private Map<String, Integer> ratingDistribution;

    private Long viewCount;
    private Boolean isFeatured;

    @TableField(exist = false)
    private String[] tags;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime publishedAt;
}
