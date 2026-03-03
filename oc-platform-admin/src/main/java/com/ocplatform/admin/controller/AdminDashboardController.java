package com.ocplatform.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.common.entity.AuditLog;
import com.ocplatform.common.repository.AuditLogMapper;
import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.response.PageResponse;
import com.ocplatform.common.service.AuditLogService;
import com.ocplatform.product.entity.Product;
import com.ocplatform.product.repository.ProductMapper;
import com.ocplatform.product.repository.ProductVersionMapper;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.repository.UserMapper;
import com.ocplatform.comment.entity.ProductComment;
import com.ocplatform.comment.repository.ProductCommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserMapper userMapper;
    private final ProductMapper productMapper;
    private final ProductVersionMapper versionMapper;
    private final ProductCommentMapper commentMapper;
    private final AuditLogService auditLogService;

    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        // 总用户数
        long totalUsers = userMapper.selectCount(null);
        
        // 总产品数（已发布）
        long totalProducts = productMapper.selectCount(
                new LambdaQueryWrapper<Product>().eq(Product::getStatus, "PUBLISHED"));
        
        // 总下载量
        Long totalDownloads = versionMapper.getTotalDownloadCount();
        if (totalDownloads == null) totalDownloads = 0L;
        
        // 总评论数
        long totalComments = commentMapper.selectCount(null);
        
        // 今日新增用户
        OffsetDateTime todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        long newUsersToday = userMapper.selectCount(
                new LambdaQueryWrapper<User>().ge(User::getCreatedAt, todayStart));
        
        // 今日下载量暂时返回0（需要下载记录表支持）
        long downloadsToday = 0L;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalProducts", totalProducts);
        stats.put("totalDownloads", totalDownloads);
        stats.put("totalComments", totalComments);
        stats.put("newUsersToday", newUsersToday);
        stats.put("downloadsToday", downloadsToday);
        
        return ApiResponse.success(stats);
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action) {
        return ApiResponse.success(auditLogService.listLogs(page, size, userId, action));
    }
}
