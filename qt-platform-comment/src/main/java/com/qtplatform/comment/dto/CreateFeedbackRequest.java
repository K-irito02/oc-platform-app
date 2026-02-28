package com.qtplatform.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFeedbackRequest {

    @NotBlank(message = "内容不能为空")
    @Size(max = 1000, message = "内容长度不能超过1000个字符")
    private String content;

    @Size(max = 255, message = "邮箱长度不能超过255个字符")
    private String email;

    @Size(max = 100, message = "联系方式长度不能超过100个字符")
    private String contact;

    @Size(max = 50, message = "昵称长度不能超过50个字符")
    private String nickname;

    private Long parentId;

    private Boolean isPublic = true;
}
