---
alwaysApply: true
---
# API 文档规范

## 文档生成

- **Swagger / OpenAPI 3.0**: 自动生成 API 文档
  - 基于 SpringDoc OpenAPI 2.x
  - 自动扫描 Controller 层
  - 根据注解生成文档
  - 支持多种输出格式

## 访问地址

- **开发环境**: `/swagger-ui.html`
- **测试环境**: `/swagger-ui.html`
- **生产环境**: 关闭 Swagger UI

## 文档注解规范

### Controller 层

```java
@RestController
@Tag(name = "用户管理", description = "用户注册、登录、信息管理相关接口")
@RequestMapping("/api/v1/users")
public class UserController {
    
    @Operation(summary = "用户注册", description = "创建新用户账户")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "注册成功"),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "409", description = "用户已存在")
    })
    @PostMapping("/register")
    public ResponseEntity<UserVO> register(@Valid @RequestBody UserRegisterDTO dto) {
        // implementation
    }
}
```

### DTO 层

```java
@Schema(description = "用户注册请求")
public class UserRegisterDTO {
    
    @Schema(description = "用户名", required = true, example = "john_doe")
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @Schema(description = "密码", required = true, example = "password123")
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度必须在6-20位之间")
    private String password;
}
```

## 文档内容要求

### 必填信息

1. **接口描述**
   - @Tag: Controller 功能分组
   - @Operation: 接口功能说明
   - @ApiResponses: 响应状态码说明

2. **参数说明**
   - @Schema: 参数描述和示例
   - @Parameter: 路径参数说明
   - 请求/响应 DTO 详细注解

3. **错误码说明**
   - 200: 成功
   - 400: 请求参数错误
   - 401: 未授权
   - 403: 禁止访问
   - 404: 资源不存在
   - 409: 资源冲突
   - 500: 服务器内部错误

### 推荐信息

1. **示例数据**
   - 提供真实的示例值
   - 覆盖各种数据类型
   - 包含边界情况

2. **业务说明**
   - 接口使用场景
   - 业务规则说明
   - 注意事项提醒

## 文档维护

### 版本管理

- API 版本通过 URL 路径管理：`/api/v1/`, `/api/v2/`
- 重大变更需要升级版本号
- 向后兼容的变更不升级版本
- 废弃接口提前通知

### 文档更新

- 代码变更时同步更新文档注解
- 定期检查文档完整性
- 测试环境验证文档准确性
- 生产发布前文档审核

## 安全配置

### 环境控制

```yaml
# application-dev.yml
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true

# application-prod.yml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

### 访问控制

- 开发/测试环境：无限制访问
- 生产环境：仅内部网络访问
- 敏感接口：隐藏或脱敏处理

## 文档导出

### 支持格式

- HTML: Swagger UI 交互式文档
- JSON: OpenAPI 3.0 规范文件
- YAML: OpenAPI 3.0 规范文件
- PDF: 通过第三方工具转换

### 导出地址

- OpenAPI JSON: `/v3/api-docs`
- OpenAPI YAML: `/v3/api-docs.yaml`

## 最佳实践

1. **命名规范**
   - 使用清晰、描述性的接口名称
   - 统一的资源命名约定
   - RESTful 风格的 URL 设计

2. **错误处理**
   - 标准化的错误响应格式
   - 详细的错误信息说明
   - 国际化错误消息支持

3. **性能考虑**
   - 文档生成不影响接口性能
   - 合理的缓存策略
   - 异步生成大型文档
