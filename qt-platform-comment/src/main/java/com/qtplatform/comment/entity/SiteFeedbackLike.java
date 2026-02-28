package com.qtplatform.comment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("site_feedback_likes")
public class SiteFeedbackLike {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long feedbackId;
    private Long userId;
    private OffsetDateTime createdAt;
}
