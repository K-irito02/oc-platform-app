package com.ocplatform.comment.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.comment.entity.CommentLike;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CommentLikeMapper extends BaseMapper<CommentLike> {

    @Select("SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = #{commentId} AND user_id = #{userId})")
    boolean existsByCommentAndUser(@Param("commentId") Long commentId, @Param("userId") Long userId);

    @Delete("DELETE FROM comment_likes WHERE comment_id = #{commentId} AND user_id = #{userId}")
    int deleteByCommentAndUser(@Param("commentId") Long commentId, @Param("userId") Long userId);
}
