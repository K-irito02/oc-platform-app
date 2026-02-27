package com.qtplatform.comment.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qtplatform.comment.entity.ProductComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ProductCommentMapper extends BaseMapper<ProductComment> {

    @Update("UPDATE product_comments SET like_count = like_count + 1 WHERE id = #{commentId}")
    void incrementLikeCount(@Param("commentId") Long commentId);

    @Update("UPDATE product_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = #{commentId}")
    void decrementLikeCount(@Param("commentId") Long commentId);

    @Select("SELECT AVG(rating) FROM product_comments WHERE product_id = #{productId} AND rating IS NOT NULL AND status = 'PUBLISHED' AND parent_id IS NULL")
    Double getAverageRating(@Param("productId") Long productId);

    @Select("SELECT COUNT(*) FROM product_comments WHERE product_id = #{productId} AND rating IS NOT NULL AND status = 'PUBLISHED' AND parent_id IS NULL")
    int getRatingCount(@Param("productId") Long productId);

    @Select("SELECT username FROM users WHERE id = #{userId}")
    String getUsernameById(@Param("userId") Long userId);

    @Select("SELECT nickname FROM users WHERE id = #{userId}")
    String getNicknameById(@Param("userId") Long userId);

    @Select("SELECT avatar_url FROM users WHERE id = #{userId}")
    String getAvatarUrlById(@Param("userId") Long userId);

    @Update("UPDATE product_comments SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = #{commentId}")
    void incrementReplyCount(@Param("commentId") Long commentId);

    @Select("SELECT email FROM users WHERE id = #{userId}")
    String getEmailById(@Param("userId") Long userId);
}
