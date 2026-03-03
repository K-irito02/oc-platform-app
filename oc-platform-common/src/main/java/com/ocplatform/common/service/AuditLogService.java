package com.ocplatform.common.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ocplatform.common.entity.AuditLog;
import com.ocplatform.common.repository.AuditLogMapper;
import com.ocplatform.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;

    @Async("asyncExecutor")
    public void log(Long userId, String action, String targetType, Long targetId, Map<String, Object> detail, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .detail(detail)
                .ipAddress(ipAddress)
                .build();
        auditLogMapper.insert(auditLog);
    }

    public PageResponse<AuditLog> listLogs(int page, int size, Long userId, String action) {
        Page<AuditLog> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(AuditLog::getUserId, userId);
        if (StringUtils.hasText(action)) wrapper.eq(AuditLog::getAction, action);
        wrapper.orderByDesc(AuditLog::getCreatedAt);

        Page<AuditLog> result = auditLogMapper.selectPage(pageParam, wrapper);
        return PageResponse.of(result.getRecords(), result.getTotal(), page, size);
    }
}
