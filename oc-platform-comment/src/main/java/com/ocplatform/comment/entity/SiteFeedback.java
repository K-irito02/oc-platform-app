package com.ocplatform.comment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.ocplatform.common.handler.InetTypeHandler;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName(value = "site_feedbacks", autoResultMap = true)
public class SiteFeedback {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private Long parentId;
    private String email;
    private String contact;
    private String content;
    private String status;
    
    @TableField(typeHandler = InetTypeHandler.class)
    private String ipAddress;
    
    private Integer likeCount;
    private Integer replyCount;
    private Boolean isPublic;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
