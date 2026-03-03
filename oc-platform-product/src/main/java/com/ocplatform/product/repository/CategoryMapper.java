package com.ocplatform.product.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.product.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CategoryMapper extends BaseMapper<Category> {

    @Select("SELECT * FROM categories WHERE slug = #{slug}")
    Optional<Category> findBySlug(@Param("slug") String slug);

    @Select("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order")
    List<Category> findTopLevel();

    @Select("SELECT * FROM categories WHERE parent_id = #{parentId} ORDER BY sort_order")
    List<Category> findByParentId(@Param("parentId") Long parentId);

    @Select("SELECT EXISTS(SELECT 1 FROM categories WHERE slug = #{slug})")
    boolean existsBySlug(@Param("slug") String slug);
}
