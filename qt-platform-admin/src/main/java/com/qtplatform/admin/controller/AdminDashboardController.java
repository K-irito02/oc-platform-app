package com.qtplatform.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qtplatform.common.entity.AuditLog;
import com.qtplatform.common.repository.AuditLogMapper;
import com.qtplatform.common.response.ApiResponse;
import com.qtplatform.common.response.PageResponse;
import com.qtplatform.common.service.AuditLogService;
import com.qtplatform.product.entity.Product;
import com.qtplatform.product.repository.ProductMapper;
import com.qtplatform.product.repository.ProductVersionMapper;
import com.qtplatform.user.entity.User;
import com.qtplatform.user.repository.UserMapper;
import com.qtplatform.comment.entity.ProductComment;
import com.qtplatform.comment.repository.ProductCommentMapper;
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
