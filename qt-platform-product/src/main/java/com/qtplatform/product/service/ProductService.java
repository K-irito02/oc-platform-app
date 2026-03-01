package com.qtplatform.product.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.qtplatform.common.exception.BusinessException;
import com.qtplatform.common.response.ErrorCode;
import com.qtplatform.common.response.PageResponse;
import com.qtplatform.product.dto.*;
import com.qtplatform.product.entity.Category;
import com.qtplatform.product.entity.Product;
import com.qtplatform.product.repository.CategoryMapper;
import com.qtplatform.product.repository.ProductMapper;
import com.qtplatform.product.repository.ProductVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;
    private final ProductVersionMapper versionMapper;
    private final CategoryMapper categoryMapper;

    public PageResponse<ProductVO> listProducts(int page, int size, Long categoryId,
                                                 String status, String sort, String keyword) {
        Page<Product> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(status)) {
            wrapper.eq(Product::getStatus, status);
        }
        // 当没有状态参数时，不筛选状态，显示所有产品
        if (categoryId != null) {
            wrapper.eq(Product::getCategoryId, categoryId);
        }
        if (StringUtils.hasText(keyword)) {
            // 支持ID搜索（纯数字）和产品名称/描述搜索
            if (keyword.matches("\\d+")) {
                wrapper.eq(Product::getId, Long.valueOf(keyword));
            } else {
                wrapper.and(w -> w
                        .like(Product::getName, keyword)
                        .or().like(Product::getNameEn, keyword)
                        .or().like(Product::getDescription, keyword)
                        .or().like(Product::getDescriptionEn, keyword));
            }
        }

        // Sort
        if ("downloads".equals(sort)) {
            wrapper.orderByDesc(Product::getDownloadCount);
        } else if ("rating".equals(sort)) {
            wrapper.orderByDesc(Product::getRatingAverage);
        } else if ("name".equals(sort)) {
            wrapper.orderByAsc(Product::getName);
        } else {
            wrapper.orderByDesc(Product::getCreatedAt);
        }

        Page<Product> result = productMapper.selectPage(pageParam, wrapper);
        List<ProductVO> vos = result.getRecords().stream()
                .map(this::toProductVO).collect(Collectors.toList());

        return PageResponse.of(vos, result.getTotal(), page, size);
    }

    public List<ProductVO> getFeaturedProducts() {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getIsFeatured, true)
                .eq(Product::getStatus, "PUBLISHED")
                .orderByDesc(Product::getDownloadCount)
                .last("LIMIT 12");

        return productMapper.selectList(wrapper).stream()
                .map(this::toProductVO).collect(Collectors.toList());
    }

    public PageResponse<ProductVO> searchProducts(String keyword, int page, int size) {
        Page<Product> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getStatus, "PUBLISHED");
        // 支持ID搜索（纯数字）和产品名称/描述搜索
        if (keyword.matches("\\d+")) {
            wrapper.eq(Product::getId, Long.valueOf(keyword));
        } else {
            wrapper.and(w -> w
                    .like(Product::getName, keyword)
                    .or().like(Product::getNameEn, keyword)
                    .or().like(Product::getDescription, keyword)
                    .or().like(Product::getDescriptionEn, keyword));
        }
        wrapper.orderByDesc(Product::getDownloadCount);

        Page<Product> result = productMapper.selectPage(pageParam, wrapper);
        List<ProductVO> vos = result.getRecords().stream()
                .map(this::toProductVO).collect(Collectors.toList());

        return PageResponse.of(vos, result.getTotal(), page, size);
    }

    public ProductVO getProductBySlug(String slug) {
        Product product = productMapper.findBySlug(slug)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        // Increment view count asynchronously
        productMapper.incrementViewCount(product.getId());
        return toProductVO(product);
    }

    public ProductVO getProductById(Long id) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        return toProductVO(product);
    }

    @Transactional
    public ProductVO createProduct(CreateProductRequest request, Long developerId) {
        // 检查产品名称唯一性
        if (productMapper.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.PRODUCT_NAME_EXISTS);
        }
        if (StringUtils.hasText(request.getNameEn()) && productMapper.existsByNameEn(request.getNameEn())) {
            throw new BusinessException(ErrorCode.PRODUCT_NAME_EN_EXISTS);
        }
        if (productMapper.existsBySlug(request.getSlug())) {
            throw new BusinessException(ErrorCode.PRODUCT_SLUG_EXISTS);
        }

        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus() : "DRAFT";
        Product product = Product.builder()
                .name(request.getName())
                .nameEn(request.getNameEn())
                .slug(request.getSlug())
                .description(request.getDescription())
                .descriptionEn(request.getDescriptionEn())
                .categoryId(request.getCategoryId())
                .developerId(developerId)
                .status(status)
                .iconUrl(request.getIconUrl())
                .bannerUrl(request.getBannerUrl())
                .screenshots(request.getScreenshots())
                .demoVideoUrl(request.getDemoVideoUrl())
                .homepageUrl(request.getHomepageUrl())
                .sourceUrl(request.getSourceUrl())
                .license(request.getLicense())
                .downloadCount(0L)
                .viewCount(0L)
                .ratingCount(0)
                .isFeatured(false)
                .build();
        productMapper.insert(product);

        log.info("Product created: {} (id={})", product.getName(), product.getId());
        return toProductVO(product);
    }

    @Transactional
    public ProductVO updateProduct(Long id, UpdateProductRequest request) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        // 检查产品名称唯一性（更新时排除自己）
        if (StringUtils.hasText(request.getName()) && !request.getName().equals(product.getName())) {
            if (productMapper.existsByName(request.getName())) {
                throw new BusinessException(ErrorCode.PRODUCT_NAME_EXISTS);
            }
            product.setName(request.getName());
        }
        if (request.getNameEn() != null && !request.getNameEn().equals(product.getNameEn())) {
            if (productMapper.existsByNameEn(request.getNameEn())) {
                throw new BusinessException(ErrorCode.PRODUCT_NAME_EN_EXISTS);
            }
            product.setNameEn(request.getNameEn());
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getDescriptionEn() != null) product.setDescriptionEn(request.getDescriptionEn());
        if (request.getCategoryId() != null) product.setCategoryId(request.getCategoryId());
        if (request.getIconUrl() != null) product.setIconUrl(request.getIconUrl());
        if (request.getBannerUrl() != null) product.setBannerUrl(request.getBannerUrl());
        if (request.getScreenshots() != null) product.setScreenshots(request.getScreenshots());
        if (request.getDemoVideoUrl() != null) product.setDemoVideoUrl(request.getDemoVideoUrl());
        if (request.getHomepageUrl() != null) product.setHomepageUrl(request.getHomepageUrl());
        if (request.getSourceUrl() != null) product.setSourceUrl(request.getSourceUrl());
        if (request.getLicense() != null) product.setLicense(request.getLicense());
        if (request.getIsFeatured() != null) product.setIsFeatured(request.getIsFeatured());
        if (StringUtils.hasText(request.getStatus())) product.setStatus(request.getStatus());

        productMapper.updateById(product);
        return toProductVO(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        productMapper.deleteById(id);
        log.info("Product deleted: {} (id={})", product.getName(), id);
    }

    public void auditProduct(Long id, String status) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        product.setStatus(status);
        if ("PUBLISHED".equals(status) && product.getPublishedAt() == null) {
            product.setPublishedAt(OffsetDateTime.now());
        }
        productMapper.updateById(product);
        log.info("Product {} audit -> {}", id, status);
    }

    public void incrementDownloadCount(Long productId) {
        productMapper.incrementDownloadCount(productId, 1L);
    }

    private ProductVO toProductVO(Product product) {
        String categoryName = null;
        if (product.getCategoryId() != null) {
            Category category = categoryMapper.selectById(product.getCategoryId());
            if (category != null) categoryName = category.getName();
        }

        return ProductVO.builder()
                .id(product.getId())
                .name(product.getName())
                .nameEn(product.getNameEn())
                .slug(product.getSlug())
                .description(product.getDescription())
                .descriptionEn(product.getDescriptionEn())
                .categoryId(product.getCategoryId())
                .categoryName(categoryName)
                .developerId(product.getDeveloperId())
                .status(product.getStatus())
                .iconUrl(product.getIconUrl())
                .bannerUrl(product.getBannerUrl())
                .screenshots(product.getScreenshots())
                .demoVideoUrl(product.getDemoVideoUrl())
                .homepageUrl(product.getHomepageUrl())
                .sourceUrl(product.getSourceUrl())
                .license(product.getLicense())
                .downloadCount(product.getDownloadCount())
                .ratingAverage(product.getRatingAverage())
                .ratingCount(product.getRatingCount())
                .viewCount(product.getViewCount())
                .isFeatured(product.getIsFeatured())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .publishedAt(product.getPublishedAt())
                .build();
    }
}
