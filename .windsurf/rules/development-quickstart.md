---
description: 开发环境快速启动指南
scope: project
trigger: always_on
---

# 开发环境快速启动指南

## 一键启动

```bash
# 启动所有服务
cd e:\oc\qt-platform
docker compose -f docker-compose.dev.yml up -d
mvn clean package -DskipTests -pl qt-platform-app -am -q
java -jar qt-platform-app\target\qt-platform-app-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev &
cd qt-platform-web && npm run dev
```

## 服务访问

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:5173 | Vite 开发服务器（可能自动切换到5174） |
| **后端 API** | http://localhost:8081 | Spring Boot 应用 |
| **Swagger UI** | http://localhost:8081/swagger-ui.html | API 文档 |
| **PostgreSQL** | localhost:5433 | 数据库（用户：qt_user） |
| **Redis** | localhost:6380 | 缓存服务 |

## 测试账号

- **管理员**: admin@qtplatform.com / Admin@123456
- **普通用户**: user1@example.com / User@123456

## 常用命令

### Docker 服务
```bash
# 启动依赖服务
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 停止服务
docker compose -f docker-compose.dev.yml stop

# 查看日志
docker compose -f docker-compose.dev.yml logs -f
```

### 后端
```bash
# 编译（跳过测试）
mvn clean package -DskipTests

# 编译特定模块
mvn clean package -DskipTests -pl qt-platform-app -am

# 运行应用
java -jar qt-platform-app/target/qt-platform-app-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

### 前端
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 端口说明

- **8081**: 后端 API（避免与 Apache httpd 8080 冲突）
- **5173**: 前端开发服务器（Vite 默认）
- **5433**: PostgreSQL（Docker 映射 5433→5432）
- **6380**: Redis（Docker 映射 6380→6379）

## 故障排查

### 端口占用
```bash
# Windows 查看端口占用
netstat -ano | findstr :8081

# 结束进程
taskkill /PID <PID> /F
```

### 清理环境
```bash
# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 清理未使用的镜像
docker system prune

# 重新构建
mvn clean install -DskipTests
```

### 数据库重置
```bash
# 重新导入种子数据
Get-Content sql/seed.sql | docker exec -i qt-dev-postgres psql -U qt_user -d qt_platform
```

## IDE 配置

### IntelliJ IDEA
- 设置 JDK 17+
- 启用 Lombok 插件
- 配置代码风格为 Google Java Style
- 设置 .mvm 配置目录

### VS Code
- 安装 Java Extension Pack
- 安装 React/TypeScript 扩展
- 配置 ESLint 和 Prettier

## 注意事项

1. **端口冲突**: 如果 5173 被占用，Vite 会自动切换到 5174
2. **数据库密码**: 开发环境使用固定密码，生产环境请使用环境变量
3. **邮件服务**: 使用 QQ 邮箱 SMTP，需要在 application.yml 中配置授权码
4. **热重载**: 前端支持热重载，后端修改需重启应用
