package com.ocplatform.common.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.common.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {

    @Select("SELECT COUNT(*) FROM notifications WHERE user_id = #{userId} AND is_read = false")
    int countUnread(@Param("userId") Long userId);

    @Update("UPDATE notifications SET is_read = true WHERE user_id = #{userId} AND is_read = false")
    int markAllRead(@Param("userId") Long userId);
}
