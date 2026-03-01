package com.qtplatform.product.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qtplatform.common.exception.BusinessException;
import com.qtplatform.common.response.ErrorCode;
import com.qtplatform.product.dto.CategoryVO;
import com.qtplatform.product.entity.Category;
import com.qtplatform.product.entity.Product;
import com.qtplatform.product.repository.CategoryMapper;
import com.qtplatform.product.repository.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryMapper categoryMapper;
    private final ProductMapper productMapper;

    public List<CategoryVO> getAllCategories() {
        List<Category> topLevel = categoryMapper.findTopLevel();
        return topLevel.stream().map(this::toCategoryVOWithChildren).collect(Collectors.toList());
    }

    public CategoryVO getCategoryById(Long id) {
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return toCategoryVOWithChildren(category);
    }

    public CategoryVO createCategory(String name, String nameEn, String slug, Long parentId, Integer sortOrder, String icon) {
        if (categoryMapper.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "分类标识已存在");
        }

        Category category = Category.builder()
                .name(name)
                .nameEn(nameEn)
                .slug(slug)
                .parentId(parentId)
                .sortOrder(sortOrder != null ? sortOrder : 0)
                .icon(icon)
                .build();
        categoryMapper.insert(category);
        return toVO(category);
    }

    public CategoryVO updateCategory(Long id, String name, String nameEn, String slug, Long parentId, Integer sortOrder, String icon) {
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        if (slug != null && !slug.equals(category.getSlug()) && categoryMapper.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "分类标识已存在");
        }

        if (name != null) category.setName(name);
        if (nameEn != null) category.setNameEn(nameEn);
        if (slug != null) category.setSlug(slug);
        if (parentId != null) category.setParentId(parentId);
        if (sortOrder != null) category.setSortOrder(sortOrder);
        if (icon != null) category.setIcon(icon);

        categoryMapper.updateById(category);
        return toVO(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        // Check if has children
        List<Category> children = categoryMapper.findByParentId(id);
        if (!children.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该分类下有子分类，无法删除");
        }
        // Check if has products
        long productCount = productMapper.selectCount(
                new LambdaQueryWrapper<Product>().eq(Product::getCategoryId, id));
        if (productCount > 0) {
            throw new BusinessException(ErrorCode.CONFLICT, "该分类下有产品，无法删除。请先将产品移至其他分类。");
        }
        categoryMapper.deleteById(id);
    }

    private CategoryVO toCategoryVOWithChildren(Category category) {
        CategoryVO vo = toVO(category);
        List<Category> children = categoryMapper.findByParentId(category.getId());
        if (!children.isEmpty()) {
            vo.setChildren(children.stream().map(this::toCategoryVOWithChildren).collect(Collectors.toList()));
        }
        return vo;
    }

    private CategoryVO toVO(Category category) {
        return CategoryVO.builder()
                .id(category.getId())
                .name(category.getName())
                .nameEn(category.getNameEn())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .sortOrder(category.getSortOrder())
                .icon(category.getIcon())
                .build();
    }
}
