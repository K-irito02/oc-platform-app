package com.ocplatform.product.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.product.dto.*;
import com.ocplatform.product.entity.Category;
import com.ocplatform.product.entity.Product;
import com.ocplatform.product.repository.CategoryMapper;
import com.ocplatform.product.repository.ProductMapper;
import com.ocplatform.product.repository.ProductVersionMapper;
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
                                                 String status, String sort, String keyword,
                                                 Boolean isFeatured, String searchField) {
        Page<Product> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(status)) {
            wrapper.eq(Product::getStatus, status);
        }
        // 当没有状态参数时，不筛选状态，显示所有产品
        if (categoryId != null) {
            wrapper.eq(Product::getCategoryId, categoryId);
        }
        // 精选产品筛选
        if (isFeatured != null) {
            wrapper.eq(Product::getIsFeatured, isFeatured);
        }
        if (StringUtils.hasText(keyword)) {
            // 根据搜索字段类型进行搜索
            if ("id".equals(searchField)) {
                // 仅按ID搜索
                if (keyword.matches("\\d+")) {
                    wrapper.eq(Product::getId, Long.valueOf(keyword));
                }
            } else if ("name".equals(searchField)) {
                // 仅按名称搜索
                wrapper.and(w -> w
                        .like(Product::getName, keyword)
                        .or().like(Product::getNameEn, keyword));
            } else if ("slug".equals(searchField)) {
                // 仅按标识符搜索
                wrapper.like(Product::getSlug, keyword);
            } else {
                // 默认：支持ID搜索（纯数字）和产品名称/描述搜索
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
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
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

        if (StringUtils.hasText(request.getStatus()) && !request.getStatus().equals(product.getStatus())) {
            validateStatusTransition(product.getStatus(), request.getStatus(), id);
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
        
        validateStatusTransition(product.getStatus(), status, id);
        
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

    /**
     * 验证状态转换是否合法
     * 状态机规则：
     * - DRAFT -> PENDING: 至少有一个版本
     * - DRAFT -> PUBLISHED: 至少有一个已发布版本
     * - PENDING -> PUBLISHED: 至少有一个已发布版本
     * - PENDING -> REJECTED: 无条件
     * - REJECTED -> PENDING: 无条件
     * - PUBLISHED -> ARCHIVED: 无条件
     * - ARCHIVED -> PUBLISHED: 至少有一个已发布版本
     */
    private void validateStatusTransition(String currentStatus, String targetStatus, Long productId) {
        if (currentStatus.equals(targetStatus)) {
            return;
        }
        
        long allVersionCount = versionMapper.countAllVersions(productId);
        long publishedVersionCount = versionMapper.countPublishedVersions(productId);
        
        switch (currentStatus) {
            case "DRAFT":
                if ("PENDING".equals(targetStatus)) {
                    if (allVersionCount == 0) {
                        throw new BusinessException(ErrorCode.NO_VERSION, "提交审核前，请先添加至少一个版本");
                    }
                } else if ("PUBLISHED".equals(targetStatus)) {
                    if (publishedVersionCount == 0) {
                        throw new BusinessException(ErrorCode.NO_PUBLISHED_VERSION, "发布产品前，请先发布至少一个版本");
                    }
                } else if (!"ARCHIVED".equals(targetStatus)) {
                    throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                            "产品状态不能从 " + currentStatus + " 转换为 " + targetStatus);
                }
                break;
                
            case "PENDING":
                if ("PUBLISHED".equals(targetStatus)) {
                    if (publishedVersionCount == 0) {
                        throw new BusinessException(ErrorCode.NO_PUBLISHED_VERSION, "审核通过前，请先发布至少一个版本");
                    }
                } else if (!"REJECTED".equals(targetStatus) && !"DRAFT".equals(targetStatus)) {
                    throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                            "产品状态不能从 " + currentStatus + " 转换为 " + targetStatus);
                }
                break;
                
            case "REJECTED":
                if (!"PENDING".equals(targetStatus) && !"DRAFT".equals(targetStatus)) {
                    throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                            "产品状态不能从 " + currentStatus + " 转换为 " + targetStatus);
                }
                break;
                
            case "PUBLISHED":
                if (!"ARCHIVED".equals(targetStatus)) {
                    throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                            "产品状态不能从 " + currentStatus + " 转换为 " + targetStatus);
                }
                break;
                
            case "ARCHIVED":
                if ("PUBLISHED".equals(targetStatus)) {
                    if (publishedVersionCount == 0) {
                        throw new BusinessException(ErrorCode.NO_PUBLISHED_VERSION, "发布产品前，请先发布至少一个版本");
                    }
                } else if (!"DRAFT".equals(targetStatus)) {
                    throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                            "产品状态不能从 " + currentStatus + " 转换为 " + targetStatus);
                }
                break;
                
            default:
                throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION, 
                        "未知的产品状态: " + currentStatus);
        }
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
                .ratingDistribution(product.getRatingDistribution())
                .viewCount(product.getViewCount())
                .isFeatured(product.getIsFeatured())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .publishedAt(product.getPublishedAt())
                .build();
    }
}
