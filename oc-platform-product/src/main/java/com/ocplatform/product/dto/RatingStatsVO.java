package com.ocplatform.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingStatsVO {

    private Long productId;
    private BigDecimal averageRating;
    private Integer totalRatings;
    private Map<Integer, Integer> distribution;
    private Integer userRating;
}
