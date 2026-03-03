package com.ocplatform.product.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.product.entity.ProductRating;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Mapper
public interface ProductRatingMapper extends BaseMapper<ProductRating> {

    default Optional<ProductRating> findByProductAndUser(Long productId, Long userId) {
        LambdaQueryWrapper<ProductRating> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductRating::getProductId, productId)
                .eq(ProductRating::getUserId, userId);
        return Optional.ofNullable(selectOne(wrapper));
    }

    @Select("SELECT AVG(rating) FROM product_ratings WHERE product_id = #{productId}")
    Double getAverageRating(@Param("productId") Long productId);

    @Select("SELECT COUNT(*) FROM product_ratings WHERE product_id = #{productId}")
    int getRatingCount(@Param("productId") Long productId);

    @Select("SELECT rating, COUNT(*) as count FROM product_ratings WHERE product_id = #{productId} GROUP BY rating ORDER BY rating DESC")
    List<Map<String, Object>> getRatingDistribution(@Param("productId") Long productId);

    @Select("SELECT EXISTS(SELECT 1 FROM product_ratings WHERE product_id = #{productId} AND user_id = #{userId})")
    boolean existsByProductAndUser(@Param("productId") Long productId, @Param("userId") Long userId);

    @Update("UPDATE products SET rating_average = #{avg}, rating_count = #{count}, rating_distribution = #{distribution}::jsonb WHERE id = #{productId}")
    void updateProductRatingStats(@Param("productId") Long productId, @Param("avg") double avg, @Param("count") int count, @Param("distribution") String distribution);
}
