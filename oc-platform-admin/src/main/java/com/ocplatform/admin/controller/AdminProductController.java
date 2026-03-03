package com.ocplatform.admin.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.product.dto.*;
import com.ocplatform.product.service.CategoryService;
import com.ocplatform.product.service.ProductService;
import com.ocplatform.product.service.VersionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final VersionService versionService;
    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<PageResponse<ProductVO>> listProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isFeatured,
            @RequestParam(required = false) String searchField) {
        return ApiResponse.success(productService.listProducts(page, size, categoryId, status, null, keyword, isFeatured, searchField));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductVO> getProduct(@PathVariable Long id) {
        return ApiResponse.success(productService.getProductById(id));
    }

    @PostMapping
    public ApiResponse<ProductVO> createProduct(@Valid @RequestBody CreateProductRequest request,
                                                Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(productService.createProduct(request, userId));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductVO> updateProduct(@PathVariable Long id,
                                                @Valid @RequestBody UpdateProductRequest request) {
        return ApiResponse.success(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success();
    }

    @PutMapping("/{id}/audit")
    public ApiResponse<Void> auditProduct(@PathVariable Long id, @RequestBody Map<String, String> body) {
        productService.auditProduct(id, body.get("status"));
        return ApiResponse.success();
    }

    // --- Versions ---

    @GetMapping("/{id}/versions")
    public ApiResponse<java.util.List<ProductVersionVO>> getVersions(@PathVariable Long id) {
        return ApiResponse.success(versionService.getAllVersionsByProduct(id));
    }

    @PostMapping("/{id}/versions")
    public ApiResponse<ProductVersionVO> createVersion(@PathVariable Long id,
                                                       @Valid @RequestBody CreateVersionRequest request) {
        return ApiResponse.success(versionService.createVersion(id, request));
    }

    @PutMapping("/versions/{vid}/publish")
    public ApiResponse<Void> publishVersion(@PathVariable Long vid) {
        versionService.publishVersion(vid);
        return ApiResponse.success();
    }

    @DeleteMapping("/versions/{vid}")
    public ApiResponse<Void> deleteVersion(@PathVariable Long vid) {
        versionService.deleteVersion(vid);
        return ApiResponse.success();
    }

    @PutMapping("/versions/{vid}/audit")
    public ApiResponse<Void> auditVersion(@PathVariable Long vid, @RequestBody Map<String, String> body) {
        versionService.auditVersion(vid, body.get("status"));
        return ApiResponse.success();
    }

    // --- Categories ---

    @PostMapping("/categories")
    public ApiResponse<CategoryVO> createCategory(@RequestBody Map<String, Object> body) {
        return ApiResponse.success(categoryService.createCategory(
                (String) body.get("name"),
                (String) body.get("nameEn"),
                (String) body.get("slug"),
                body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null,
                body.get("sortOrder") != null ? Integer.valueOf(body.get("sortOrder").toString()) : null,
                (String) body.get("icon")
        ));
    }

    @PutMapping("/categories/{id}")
    public ApiResponse<CategoryVO> updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.success(categoryService.updateCategory(id,
                (String) body.get("name"),
                (String) body.get("nameEn"),
                (String) body.get("slug"),
                body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null,
                body.get("sortOrder") != null ? Integer.valueOf(body.get("sortOrder").toString()) : null,
                (String) body.get("icon")
        ));
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success();
    }
}
