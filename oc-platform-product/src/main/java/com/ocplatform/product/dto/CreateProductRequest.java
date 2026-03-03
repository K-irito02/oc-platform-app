package com.ocplatform.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateProductRequest {

    @NotBlank(message = "产品名称不能为空")
    @Size(max = 200, message = "产品名称不能超过 200 个字符")
    private String name;

    private String nameEn;

    @NotBlank(message = "产品标识不能为空")
    @Size(max = 200, message = "产品标识不能超过 200 个字符")
    private String slug;

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
    private String status;
    private Boolean isFeatured;
}
