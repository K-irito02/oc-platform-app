package com.qtplatform.comment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class FeedbackVO {
    private Long id;
    private Long userId;
    private Long parentId;
    private String nickname;
    private String username;
    private String email;
    private String avatarUrl;
    private String replyToName;
    private String content;
    private Integer likeCount;
    private Integer replyCount;
    private Boolean liked;
    private Boolean isPublic;
    private String status;
    private OffsetDateTime createdAt;
    private java.util.List<FeedbackVO> replies;
}
