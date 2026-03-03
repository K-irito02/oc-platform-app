package com.ocplatform.comment.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.comment.entity.ProductComment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

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

    @Select("SELECT username FROM users WHERE id = #{userId,jdbcType=BIGINT}")
    String getUsernameById(@Param("userId") Long userId);

    @Select("SELECT avatar_url FROM users WHERE id = #{userId,jdbcType=BIGINT}")
    String getAvatarUrlById(@Param("userId") Long userId);

    @Update("UPDATE product_comments SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = #{commentId}")
    void incrementReplyCount(@Param("commentId") Long commentId);

    @Select("SELECT email FROM users WHERE id = #{userId,jdbcType=BIGINT}")
    String getEmailById(@Param("userId") Long userId);

    @Select("<script>" +
            "SELECT c.* FROM product_comments c " +
            "LEFT JOIN users u ON c.user_id = u.id " +
            "WHERE 1=1 " +
            "<if test='status != null'> AND c.status = #{status} </if>" +
            "<if test='productId != null'> AND c.product_id = #{productId} </if>" +
            "<if test='searchValue != null and searchValue != \"\"'>" +
            "  <choose>" +
            "    <when test='searchType == \"all\"'>" +
            "      AND (c.id::text = #{searchValue} OR c.user_id::text = #{searchValue} OR c.product_id::text = #{searchValue} " +
            "        OR u.username ILIKE CONCAT('%', #{searchValue}, '%') " +
            "        OR u.email ILIKE CONCAT('%', #{searchValue}, '%') " +
            "        OR c.content ILIKE CONCAT('%', #{searchValue}, '%'))" +
            "    </when>" +
            "    <when test='searchType == \"commentId\"'> AND c.id::text = #{searchValue} </when>" +
            "    <when test='searchType == \"productId\"'> AND c.product_id::text = #{searchValue} </when>" +
            "    <when test='searchType == \"userId\"'> AND c.user_id::text = #{searchValue} </when>" +
            "    <when test='searchType == \"username\"'> AND u.username ILIKE CONCAT('%', #{searchValue}, '%') </when>" +
            "    <when test='searchType == \"email\"'> AND u.email ILIKE CONCAT('%', #{searchValue}, '%') </when>" +
            "    <when test='searchType == \"content\"'> AND c.content ILIKE CONCAT('%', #{searchValue}, '%') </when>" +
            "  </choose>" +
            "</if>" +
            " ORDER BY c.created_at DESC" +
            "</script>")
    List<ProductComment> searchCommentsWithUser(@Param("status") String status, 
                                               @Param("productId") Long productId, 
                                               @Param("searchType") String searchType,
                                               @Param("searchValue") String searchValue);
}
