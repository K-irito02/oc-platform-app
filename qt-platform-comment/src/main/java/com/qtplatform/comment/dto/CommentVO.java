package com.qtplatform.comment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentVO {

    private Long id;
    private Long productId;
    private Long userId;
    private String username;
    private String avatarUrl;
    private Long parentId;
    private String content;
    private Integer rating;
    private String status;
    private Integer likeCount;
    private Integer replyCount;
    private Boolean liked; // current user liked or not
    private Long replyToUserId; // 回复的目标用户ID
    private String replyToUsername; // 回复的目标用户名
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<CommentVO> replies;
}
