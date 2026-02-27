# 后端架构记忆

> 最后更新: 2026-02-27

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.12 | 后端框架 |
| Spring Security | 6.2.x | 认证授权（JWT + RBAC） |
| MyBatis-Plus | 3.5.x | ORM（复杂 SQL） |
| Spring Data JPA | 3.2.x | ORM（简单 CRUD，当前 ddl-auto=none） |
| PostgreSQL | 15.x | 主数据库 |
| Redis | 7.x | 缓存 + 限流（单机模式，Docker映射6380→6379） |
| SpringDoc OpenAPI | 2.x | API 文档（Swagger UI） |
| Hibernate Validator | 3.x | 参数校验 |
| Lombok | — | 代码简化 |
| Logback | — | JSON 格式日志 |

## 项目路径

`qt-platform/`（Maven 多模块项目）

## 模块结构

```
qt-platform/
├── pom.xml                        # 父 POM（Spring Boot 3.2.12）
├── qt-platform-common/            # 公共模块
│   └── src/main/java/com/qtplatform/common/
│       ├── config/                # RedisConfig, JacksonConfig, AsyncConfig, MyBatisPlusConfig
│       ├── constant/              # RedisKeys 等常量
│       ├── entity/                # SystemConfig, FileRecord, AuditLog 等公共实体
│       ├── exception/             # BusinessException, GlobalExceptionHandler, ErrorCode
│       ├── repository/            # SystemConfigMapper, FileRecordMapper, AuditLogMapper
│       ├── response/              # ApiResponse<T>, PageResponse<T>, ErrorCode
│       ├── util/                  # JwtUtil, FileUtil, SemanticVersion, IpUtil
│       └── validation/            # 自定义校验注解
│
├── qt-platform-user/              # 用户模块
│   └── src/main/java/com/qtplatform/user/
│       ├── controller/            # AuthController, OAuthController, UserController
│       ├── service/               # AuthService, OAuthService, UserService, EmailService
│       ├── repository/            # UserMapper, RoleMapper, UserRoleMapper, OAuthBindingMapper, EmailVerificationMapper
│       ├── entity/                # User, Role, UserRole, UserOauthBinding, EmailVerification
│       ├── dto/                   # LoginRequest, RegisterRequest, LoginResponse, UpdateProfileRequest 等
│       ├── vo/                    # UserProfileVO
│       └── security/              # SecurityConfig, JwtAuthenticationFilter, JwtAuthenticationEntryPoint, JwtAccessDeniedHandler
│
├── qt-platform-product/           # 产品模块
│   └── src/main/java/com/qtplatform/product/
│       ├── controller/            # ProductController, VersionController, CategoryController, DownloadController, UpdateController
│       ├── service/               # ProductService, VersionService, CategoryService, DownloadService, UpdateService
│       ├── repository/            # ProductMapper, ProductVersionMapper, CategoryMapper, DeltaUpdateMapper, DownloadRecordMapper
│       ├── entity/                # Product, ProductVersion, Category, DeltaUpdate, DownloadRecord
│       └── dto/                   # ProductVO, VersionVO, CategoryVO 等
│
├── qt-platform-comment/           # 评论模块
│   └── src/main/java/com/qtplatform/comment/
│       ├── controller/            # CommentController
│       ├── service/               # CommentService
│       ├── repository/            # CommentMapper, CommentLikeMapper
│       ├── entity/                # ProductComment, CommentLike
│       └── dto/                   # CommentVO 等
│
├── qt-platform-file/              # 文件模块
│   └── src/main/java/com/qtplatform/file/
│       ├── controller/            # FileController
│       ├── service/               # FileStorageService, ChecksumService
│       ├── entity/                # (使用 common 模块的 FileRecord)
│       └── config/                # StorageConfig
│
├── qt-platform-admin/             # 后台管理模块
│   └── src/main/java/com/qtplatform/admin/
│       ├── controller/            # AdminDashboardController, AdminUserController, AdminProductController,
│       │                          # AdminCommentController, AdminCategoryController, AdminFileController,
│       │                          # AdminStatsController, AdminSystemController
│       ├── service/               # 管理服务
│       └── vo/                    # 管理视图对象
│
└── qt-platform-app/               # 主应用启动模块
    ├── Dockerfile                 # 多阶段构建
    └── src/main/
        ├── java/.../QtPlatformApplication.java
        └── resources/
            ├── application.yml        # 主配置
            ├── application-dev.yml    # 开发环境（show-sql=true, swagger=true）
            ├── application-prod.yml   # 生产环境（swagger=false）
            └── logback-spring.xml     # 日志配置
```

## 关键配置

| 配置项 | 值 | 说明 |
|--------|------|------|
| 服务端口 | 8081 | 本机 8080 被 Apache httpd 占用 |
| 数据库 | qt_platform / qt_user | PostgreSQL 15（Docker映射5433→5432） |
| Redis | localhost:6379 | 单机模式（Docker映射6380→6379） |
| JWT 有效期 | access=2h, refresh=7d | |
| 文件上传路径 | ./uploads | 本地存储 |
| 最大文件大小 | 1GB | |
| Swagger UI | /swagger-ui.html | 开发环境开启（http://localhost:8081/swagger-ui.html） |
| JPA ddl-auto | none | 使用 SQL 脚本管理表结构 |

## 包命名规范

- 基础包: `com.qtplatform`
- 模块包: `com.qtplatform.{module}` (user/product/comment/file/admin/common)

## 构建命令

```bash
cd qt-platform
# 编译全部模块
./mvnw clean package -DskipTests

# 启动应用（开发环境）
cd qt-platform-app
../mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 单独编译某模块
./mvnw clean package -pl qt-platform-user -am
```

## 环境变量

参见 `qt-platform/.env.example`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`
- `UPLOAD_PATH`, `MAX_FILE_SIZE`
