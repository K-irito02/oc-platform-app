package com.ocplatform.comment.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("comment_likes")
public class CommentLike {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long commentId;
    private Long userId;
    private OffsetDateTime createdAt;
}
