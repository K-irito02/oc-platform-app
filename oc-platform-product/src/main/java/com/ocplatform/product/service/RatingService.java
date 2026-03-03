package com.ocplatform.product.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.product.dto.CreateRatingRequest;
import com.ocplatform.product.dto.RatingStatsVO;
import com.ocplatform.product.dto.RatingVO;
import com.ocplatform.product.entity.Product;
import com.ocplatform.product.entity.ProductRating;
import com.ocplatform.product.repository.ProductMapper;
import com.ocplatform.product.repository.ProductRatingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatingService {

    private final ProductRatingMapper ratingMapper;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public RatingVO createRating(Long productId, CreateRatingRequest request, Long userId) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        if (ratingMapper.existsByProductAndUser(productId, userId)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RATING, "您已对该产品评过分");
        }

        ProductRating rating = ProductRating.builder()
                .productId(productId)
                .userId(userId)
                .rating(request.getRating())
                .build();
        ratingMapper.insert(rating);

        updateProductRatingStats(productId);

        log.info("Rating created: productId={}, userId={}, rating={}", productId, userId, request.getRating());
        return toVO(rating);
    }

    @Transactional
    public RatingVO updateRating(Long ratingId, CreateRatingRequest request, Long userId) {
        ProductRating rating = ratingMapper.selectById(ratingId);
        if (rating == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "评分不存在");
        }
        if (!rating.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "无权修改此评分");
        }

        rating.setRating(request.getRating());
        rating.setUpdatedAt(OffsetDateTime.now());
        ratingMapper.updateById(rating);

        updateProductRatingStats(rating.getProductId());

        log.info("Rating updated: id={}, newRating={}", ratingId, request.getRating());
        return toVO(rating);
    }

    @Transactional
    public void deleteRating(Long ratingId, Long userId, boolean isAdmin) {
        ProductRating rating = ratingMapper.selectById(ratingId);
        if (rating == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, "评分不存在");
        }
        if (!isAdmin && !rating.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "无权删除此评分");
        }

        Long productId = rating.getProductId();
        ratingMapper.deleteById(ratingId);

        updateProductRatingStats(productId);

        log.info("Rating deleted: id={}, productId={}", ratingId, productId);
    }

    public RatingVO getUserRating(Long productId, Long userId) {
        if (userId == null) {
            return null;
        }
        return ratingMapper.findByProductAndUser(productId, userId)
                .map(this::toVO)
                .orElse(null);
    }

    public RatingStatsVO getRatingStats(Long productId, Long currentUserId) {
        Double avgRating = ratingMapper.getAverageRating(productId);
        int totalCount = ratingMapper.getRatingCount(productId);
        List<Map<String, Object>> distributionList = ratingMapper.getRatingDistribution(productId);

        Map<Integer, Integer> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0);
        }
        for (Map<String, Object> item : distributionList) {
            Integer rating = (Integer) item.get("rating");
            Long count = (Long) item.get("count");
            distribution.put(rating, count.intValue());
        }

        Integer userRating = null;
        if (currentUserId != null) {
            userRating = ratingMapper.findByProductAndUser(productId, currentUserId)
                    .map(ProductRating::getRating)
                    .orElse(null);
        }

        BigDecimal avg = avgRating != null ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return RatingStatsVO.builder()
                .productId(productId)
                .averageRating(avg)
                .totalRatings(totalCount)
                .distribution(distribution)
                .userRating(userRating)
                .build();
    }

    public PageResponse<RatingVO> getUserRatings(Long userId, int page, int size) {
        Page<ProductRating> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ProductRating> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductRating::getUserId, userId)
                .orderByDesc(ProductRating::getCreatedAt);

        Page<ProductRating> result = ratingMapper.selectPage(pageParam, wrapper);
        List<RatingVO> vos = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return PageResponse.of(vos, result.getTotal(), page, size);
    }

    @Transactional
    public void updateProductRatingStats(Long productId) {
        Double avgRating = ratingMapper.getAverageRating(productId);
        int totalCount = ratingMapper.getRatingCount(productId);
        List<Map<String, Object>> distributionList = ratingMapper.getRatingDistribution(productId);

        Map<Integer, Integer> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0);
        }
        for (Map<String, Object> item : distributionList) {
            Integer rating = (Integer) item.get("rating");
            Long count = (Long) item.get("count");
            distribution.put(rating, count.intValue());
        }

        String distributionJson;
        try {
            distributionJson = objectMapper.writeValueAsString(distribution);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize rating distribution", e);
            distributionJson = "{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}";
        }

        double avg = avgRating != null ? avgRating : 0.0;
        ratingMapper.updateProductRatingStats(productId, avg, totalCount, distributionJson);

        log.info("Product rating stats updated: productId={}, avg={}, count={}", productId, avg, totalCount);
    }

    private RatingVO toVO(ProductRating rating) {
        String username = jdbcTemplate.queryForObject(
                "SELECT username FROM users WHERE id = ?", 
                String.class, rating.getUserId());

        Product product = productMapper.selectById(rating.getProductId());
        String productName = product != null ? product.getName() : null;
        String productSlug = product != null ? product.getSlug() : null;
        String productIcon = product != null ? product.getIconUrl() : null;

        return RatingVO.builder()
                .id(rating.getId())
                .productId(rating.getProductId())
                .userId(rating.getUserId())
                .username(username)
                .productName(productName)
                .productSlug(productSlug)
                .productIcon(productIcon)
                .rating(rating.getRating())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}
