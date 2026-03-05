package com.ocplatform.product.dto;

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
public class ProductVO {

    private Long id;
    private String name;
    private String nameEn;
    private String slug;
    private String description;
    private String descriptionEn;
    private Long categoryId;
    private String categoryName;
    private Long developerId;
    private String status;
    private String iconUrl;
    private String bannerUrl;
    private List<String> screenshots;
    private String demoVideoUrl;
    private String homepageUrl;
    private String sourceUrl;
    private String license;
    private Long downloadCount;
    private BigDecimal ratingAverage;
    private Integer ratingCount;
    private Map<String, Integer> ratingDistribution;
    private BigDecimal experienceRatingAverage;
    private Integer experienceRatingCount;
    private Long viewCount;
    private Boolean isFeatured;
    private String developerName;
    private String latestVersionStr;
    private Map<String, Long> displayVersions;
    private Map<String, ProductVersionVO> displayVersionMap;
    private List<String> tags;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime publishedAt;
    private ProductVersionVO latestVersion;
}
