package com.qtplatform.comment.entity;

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
@TableName("product_comments")
public class ProductComment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;
    private Long userId;
    private Long parentId;
    private String content;
    private Integer rating;
    private String status;
    private Integer likeCount;
    private Integer replyCount;
    private String ipAddress;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
