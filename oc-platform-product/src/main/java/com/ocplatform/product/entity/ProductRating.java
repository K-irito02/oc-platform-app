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
@TableName("product_ratings")
public class ProductRating {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;
    private Long userId;
    private Integer rating;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
