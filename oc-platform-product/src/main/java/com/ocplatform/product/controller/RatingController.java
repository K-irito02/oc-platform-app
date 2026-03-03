package com.ocplatform.product.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.product.dto.CreateRatingRequest;
import com.ocplatform.product.dto.RatingStatsVO;
import com.ocplatform.product.dto.RatingVO;
import com.ocplatform.product.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/product/{productId}")
    public ApiResponse<RatingVO> createRating(
            @PathVariable Long productId,
            @Valid @RequestBody CreateRatingRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(ratingService.createRating(productId, request, userId));
    }

    @PutMapping("/{id}")
    public ApiResponse<RatingVO> updateRating(
            @PathVariable Long id,
            @Valid @RequestBody CreateRatingRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(ratingService.updateRating(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRating(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        ratingService.deleteRating(id, userId, isAdmin);
        return ApiResponse.success();
    }

    @GetMapping("/product/{productId}/stats")
    public ApiResponse<RatingStatsVO> getRatingStats(
            @PathVariable Long productId,
            Authentication authentication) {
        Long currentUserId = authentication != null ? (Long) authentication.getPrincipal() : null;
        return ApiResponse.success(ratingService.getRatingStats(productId, currentUserId));
    }

    @GetMapping("/product/{productId}/me")
    public ApiResponse<RatingVO> getMyRating(
            @PathVariable Long productId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(ratingService.getUserRating(productId, userId));
    }

    @GetMapping("/me")
    public ApiResponse<PageResponse<RatingVO>> getMyRatings(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ApiResponse.success(ratingService.getUserRatings(userId, page, size));
    }
}
