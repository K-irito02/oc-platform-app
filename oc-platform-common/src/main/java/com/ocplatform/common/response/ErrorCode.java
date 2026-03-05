package com.ocplatform.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // 通用错误 1xxxx
    SUCCESS(0, "success"),
    UNKNOWN_ERROR(10000, "未知错误"),
    PARAM_INVALID(10001, "参数校验失败"),
    RESOURCE_NOT_FOUND(10002, "资源不存在"),
    METHOD_NOT_ALLOWED(10003, "请求方法不支持"),
    TOO_MANY_REQUESTS(10004, "请求过于频繁，请稍后再试"),

    // 认证错误 2xxxx
    UNAUTHORIZED(20001, "未登录或 Token 已过期"),
    ACCESS_DENIED(20002, "权限不足"),
    LOGIN_FAILED(20003, "用户名或密码错误"),
    USER_NOT_REGISTERED(20009, "该账号未注册，请先注册"),
    ACCOUNT_DISABLED(20004, "账号已被禁用"),
    ACCOUNT_LOCKED(20005, "账号已被锁定"),
    TOKEN_EXPIRED(20006, "Token 已过期"),
    TOKEN_INVALID(20007, "Token 无效"),
    REFRESH_TOKEN_EXPIRED(20008, "Refresh Token 已过期"),

    // 用户错误 3xxxx
    USER_NOT_FOUND(30001, "用户不存在"),
    USERNAME_EXISTS(30002, "用户名已存在"),
    EMAIL_EXISTS(30003, "邮箱已被注册"),
    EMAIL_NOT_VERIFIED(30004, "邮箱未验证"),
    VERIFICATION_CODE_INVALID(30005, "验证码无效或已过期"),
    VERIFICATION_CODE_TOO_FREQUENT(30006, "验证码发送过于频繁"),
    OLD_PASSWORD_WRONG(30007, "旧密码错误"),
    OAUTH_bindING_EXISTS(30008, "该第三方账号已绑定其他用户"),

    // 产品错误 4xxxx
    PRODUCT_NOT_FOUND(40001, "产品不存在"),
    PRODUCT_SLUG_EXISTS(40002, "产品标识已存在"),
    PRODUCT_NAME_EXISTS(40003, "产品名称已存在"),
    PRODUCT_NAME_EN_EXISTS(40004, "产品英文名称已存在"),
    VERSION_NOT_FOUND(40005, "版本不存在"),
    VERSION_EXISTS(40006, "版本号已存在"),
    CATEGORY_NOT_FOUND(40007, "分类不存在"),
    CATEGORY_HAS_PRODUCTS(40008, "该分类下有产品，无法删除"),
    CATEGORY_HAS_CHILDREN(40009, "该分类下有子分类，无法删除"),
    CONFLICT(40010, "资源冲突"),
    INVALID_STATUS_TRANSITION(40011, "无效的状态转换"),
    NO_PUBLISHED_VERSION(40012, "没有已发布的版本"),
    NO_VERSION(40013, "没有添加任何版本"),
    CANNOT_DELETE_LAST_PUBLISHED_VERSION(40014, "无法删除最后一个已发布版本"),

    // 文件错误 5xxxx
    FILE_NOT_FOUND(50001, "文件不存在"),
    FILE_TOO_LARGE(50002, "文件大小超出限制"),
    FILE_TYPE_NOT_ALLOWED(50003, "文件类型不允许"),
    FILE_UPLOAD_FAILED(50004, "文件上传失败"),
    FILE_CHECKSUM_MISMATCH(50005, "文件校验失败"),

    // 评论错误 6xxxx
    COMMENT_NOT_FOUND(60001, "评论不存在"),
    COMMENT_ALREADY_LIKED(60002, "已经点赞过"),
    COMMENT_SELF_REPLY(60003, "不能回复自己的评论"),
    DUPLICATE_RATING(60004, "已经评分过该产品"),
    RATE_LIMIT_EXCEEDED(60005, "评论发布过于频繁，请稍后再试");

    private final int code;
    private final String message;
}
