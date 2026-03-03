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
public class RatingVO {

    private Long id;
    private Long productId;
    private Long userId;
    private String username;
    private String productName;
    private String productSlug;
    private String productIcon;
    private Integer rating;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
