package com.ocplatform.product.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.product.dto.*;
import com.ocplatform.product.service.PlatformConfigService;
import com.ocplatform.product.service.ProductService;
import com.ocplatform.product.service.VersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final VersionService versionService;
    private final PlatformConfigService platformConfigService;

    @GetMapping
    public ApiResponse<PageResponse<ProductVO>> listProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productService.listProducts(page, size, categoryId, "PUBLISHED", sort, keyword, null, null));
    }

    @GetMapping("/featured")
    public ApiResponse<List<ProductVO>> getFeaturedProducts() {
        return ApiResponse.success(productService.getFeaturedProducts());
    }

    @GetMapping("/search")
    public ApiResponse<PageResponse<ProductVO>> searchProducts(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(productService.searchProducts(q, page, size));
    }

    @GetMapping("/{slug}")
    public ApiResponse<ProductVO> getProductBySlug(@PathVariable String slug) {
        return ApiResponse.success(productService.getProductBySlug(slug));
    }

    @GetMapping("/public/{slug}")
    public ApiResponse<ProductVO> getPublicProductBySlug(@PathVariable String slug) {
        return ApiResponse.success(productService.getProductBySlug(slug));
    }

    @GetMapping("/public/id/{id}")
    public ApiResponse<ProductVO> getPublicProductById(@PathVariable Long id) {
        return ApiResponse.success(productService.getProductById(id));
    }

    @GetMapping("/{id}/versions")
    public ApiResponse<List<ProductVersionVO>> getVersions(@PathVariable Long id) {
        return ApiResponse.success(versionService.getVersionsByProduct(id));
    }

    @GetMapping("/{id}/versions/latest")
    public ApiResponse<ProductVersionVO> getLatestVersion(@PathVariable Long id) {
        return ApiResponse.success(versionService.getLatestVersion(id));
    }

    // ===== Admin operations =====

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ProductVO> createProduct(@Valid @RequestBody CreateProductRequest request,
                                                Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(productService.createProduct(request, userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ProductVO> updateProduct(@PathVariable Long id,
                                                @Valid @RequestBody UpdateProductRequest request) {
        return ApiResponse.success(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success();
    }

    @GetMapping("/{id}/versions/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<ProductVersionVO>> getAllVersions(@PathVariable Long id) {
        return ApiResponse.success(versionService.getAllVersionsByProduct(id));
    }

    @PostMapping("/{id}/versions")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ProductVersionVO> createVersion(@PathVariable Long id,
                                                       @Valid @RequestBody CreateVersionRequest request) {
        return ApiResponse.success(versionService.createVersion(id, request));
    }

    @PostMapping("/versions/{vid}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> publishVersion(@PathVariable Long vid) {
        versionService.publishVersion(vid);
        return ApiResponse.success();
    }

    @DeleteMapping("/versions/{vid}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteVersion(@PathVariable Long vid) {
        versionService.deleteVersion(vid);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/versions/{vid}/rollback")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> rollbackVersion(@PathVariable Long id, @PathVariable Long vid) {
        versionService.rollbackVersion(id, vid);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/download")
    public ApiResponse<Void> incrementDownloadCount(@PathVariable Long id) {
        productService.incrementDownloadCount(id);
        return ApiResponse.success();
    }

    @PostMapping("/versions/{vid}/download")
    public ApiResponse<Void> incrementVersionDownloadCount(@PathVariable Long vid) {
        versionService.incrementDownloadCount(vid);
        return ApiResponse.success();
    }

    // ===== Platform Config =====

    @GetMapping("/platform-config")
    public ApiResponse<PlatformConfigVO> getPlatformConfig() {
        return ApiResponse.success(platformConfigService.getPlatformConfig());
    }

    @PutMapping("/platform-config")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> updatePlatformConfig(@RequestBody PlatformConfigVO config) {
        platformConfigService.updatePlatformConfig(config);
        return ApiResponse.success();
    }
}
