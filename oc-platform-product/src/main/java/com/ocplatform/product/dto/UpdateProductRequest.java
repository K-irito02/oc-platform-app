package com.ocplatform.product.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UpdateProductRequest {

    @Size(max = 200, message = "产品名称不能超过 200 个字符")
    private String name;

    private String nameEn;
    private String description;
    private String descriptionEn;
    private Long categoryId;
    private String iconUrl;
    private String bannerUrl;
    private List<String> screenshots;
    private String demoVideoUrl;
    private String homepageUrl;
    private String sourceUrl;
    private String license;
    private List<String> tags;
    private Boolean isFeatured;
    private String status;

    @Size(max = 255, message = "开发者名称不能超过 255 个字符")
    private String developerName;
    private Map<String, Long> displayVersions;
}
