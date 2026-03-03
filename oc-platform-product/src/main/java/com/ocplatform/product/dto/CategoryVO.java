package com.ocplatform.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryVO {

    private Long id;
    private String name;
    private String nameEn;
    private String slug;
    private Long parentId;
    private Integer sortOrder;
    private String icon;
    private List<CategoryVO> children;
}
