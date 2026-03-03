package com.ocplatform.common.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ocplatform.common.entity.Notification;
import com.ocplatform.common.repository.NotificationMapper;
import com.ocplatform.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    public PageResponse<Notification> getUserNotifications(Long userId, int page, int size, Boolean isRead) {
        Page<Notification> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId);
        if (isRead != null) {
            wrapper.eq(Notification::getIsRead, isRead);
        }
        wrapper.orderByDesc(Notification::getCreatedAt);

        Page<Notification> result = notificationMapper.selectPage(pageParam, wrapper);
        return PageResponse.of(result.getRecords(), result.getTotal(), page, size);
    }

    public int getUnreadCount(Long userId) {
        return notificationMapper.countUnread(userId);
    }

    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationMapper.selectById(notificationId);
        if (notification != null && notification.getUserId().equals(userId)) {
            notification.setIsRead(true);
            notificationMapper.updateById(notification);
        }
    }

    public void markAllRead(Long userId) {
        notificationMapper.markAllRead(userId);
    }

    public void sendNotification(Long userId, String type, String title, String content, String link) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .content(content)
                .link(link)
                .isRead(false)
                .build();
        notificationMapper.insert(notification);
    }

    public void sendBatchNotification(List<Long> userIds, String type, String title, String content, String link) {
        for (Long userId : userIds) {
            sendNotification(userId, type, title, content, link);
        }
    }
}
