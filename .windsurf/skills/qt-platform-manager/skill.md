---
name: qt-platform-manager
description: |
  Qt Platform 项目自动化管理技能 - 统一管理开发环境启动、停止和状态检查
  包括 Docker 依赖服务 (PostgreSQL + Redis)、Spring Boot 后端服务、Vite 前端开发服务器
  支持智能端口检测、自动编译判断和故障排查
---

# Qt Platform 项目管理技能

> 自动化检查/执行项目依赖、后端/前端构建及运行

## 概述

本技能用于管理 Qt Platform 项目的启动和停止，包括：
- Docker 依赖服务 (PostgreSQL + Redis)
- Spring Boot 后端服务
- Vite 前端开发服务器

## 触发条件

当用户请求以下操作时触发：
- "启动项目"、"start project"、"运行项目"
- "停止项目"、"stop project"、"关闭项目"
- "重启项目"、"restart project"
- "检查项目状态"、"project status"

---

## 启动项目流程

### 1. 检查 Docker Desktop

```powershell
docker info >$null 2>&1; if ($LASTEXITCODE -ne 0) { Write-Error "Docker Desktop 未运行，请先启动 Docker Desktop"; exit 1 } else { Write-Output "Docker Desktop 已就绪" }
```

如果 Docker Desktop 未运行，提醒用户手动启动后重试。

### 2. 启动 Docker 依赖服务

// turbo
```powershell
docker compose -f docker-compose.dev.yml up -d
```

工作目录：`e:\oc\qt-platform`

等待服务健康检查：

// turbo
```powershell
Start-Sleep -Seconds 5; docker compose -f docker-compose.dev.yml ps
```

确认 `qt-dev-postgres` 和 `qt-dev-redis` 状态为 healthy。

**服务信息：**
- PostgreSQL: localhost:5433, 用户 qt_user, 密码 3143285505
- Redis: localhost:6380, 密码 3143285505

### 3. 检查种子数据

// turbo
```powershell
$count = docker exec qt-dev-postgres psql -U qt_user -d qt_platform -t -c "SELECT count(*) FROM categories;" 2>$null; if ([int]$count.Trim() -eq 0) { Write-Output "NEED_SEED" } else { Write-Output "SEED_EXISTS: $($count.Trim()) categories" }
```

如果输出 `NEED_SEED`，执行种子数据导入：

```powershell
Get-Content sql/seed.sql | docker exec -i qt-dev-postgres psql -U qt_user -d qt_platform
```

工作目录：`e:\oc\qt-platform`

### 4. 停止已有 Java 进程

```powershell
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null; Write-Output "已清理旧 Java 进程"
```

### 5. 编译后端（按需）

**判断是否需要重新编译：**
- 如果 `qt-platform-app/target/qt-platform-app-1.0.0-SNAPSHOT.jar` 不存在 → 需要编译
- 如果后端 Java 代码有修改（通过 git status 检查）→ 需要编译
- 否则跳过编译

// turbo
```powershell
mvn clean package -DskipTests -pl qt-platform-app -am -q
```

工作目录：`e:\oc\qt-platform`

编译约需 30-60 秒。

### 6. 启动后端

```powershell
java -jar qt-platform-app\target\qt-platform-app-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

工作目录：`e:\oc\qt-platform`

以非阻塞方式运行，等待约 10 秒确认启动成功（看到 `Started QtPlatformApplication`）。

**后端信息：**
- API 地址: http://localhost:8081
- Swagger UI: http://localhost:8081/swagger-ui.html

### 7. 启动前端（按需）

**判断是否需要启动：**
- 检查 localhost:5173 是否已有服务运行
- 检查 localhost:5174 是否已有服务运行（备用端口）
- 如果已运行，跳过

```powershell
npm run dev
```

工作目录：`e:\oc\qt-platform\qt-platform-web`

以非阻塞方式运行，等待约 5 秒确认启动成功（看到 `VITE ready`）。

**前端信息：**
- 前端地址: http://localhost:5173（如果端口被占用会自动切换到5174）

### 8. 验证全链路

// turbo
```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8081/api/v1/categories
```

返回 `200` 表示后端正常。

// turbo
```powershell
$frontendPort = 5173
$frontendStatus = curl.exe -s -o NUL -w "%{http_code}" http://localhost:$frontendPort 2>$null
if ($frontendStatus -ne "200") {
    $frontendPort = 5174
    $frontendStatus = curl.exe -s -o NUL -w "%{http_code}" http://localhost:$frontendPort 2>$null
}
Write-Output "前端端口: $frontendPort, 状态码: $frontendStatus"
```

返回 `200` 表示前端正常。

---

## 停止项目流程

### 1. 停止 Java 后端进程

```powershell
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null; Write-Output "后端已停止"
```

### 2. 停止 Docker 依赖服务

// turbo
```powershell
docker compose -f docker-compose.dev.yml stop
```

工作目录：`e:\oc\qt-platform`

> 注意：使用 `stop` 而非 `down`，保留数据卷。如需彻底清除数据，使用 `docker compose -f docker-compose.dev.yml down -v`。

### 3. 前端服务

前端开发服务器（Vite）会随终端关闭自动停止，无需额外处理。

---

## 重启项目流程

1. 执行停止项目流程
2. 执行启动项目流程

---

## 服务端口一览

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 5173（可能自动切换到5174） | Vite 开发服务器 |
| 后端 API | 8081 | Spring Boot |
| Swagger UI | 8081/swagger-ui.html | API 文档 |
| PostgreSQL | 5433 | 数据库 |
| Redis | 6380 | 缓存 |

## 测试账号

- 管理员: admin@qtplatform.com / Admin@123456
- 普通用户: zhangsan@example.com / Test@123456

## 故障排查

### 常见问题

1. **Docker Desktop 未启动**
   - 错误: `Cannot connect to the Docker daemon`
   - 解决: 手动启动 Docker Desktop 后重试

2. **端口占用**
   - 前端 5173 被占用: 自动切换到 5174
   - 后端 8081 被占用: 检查是否有其他 Java 进程
   - PostgreSQL 5433 被占用: 停止本地 PostgreSQL 服务

3. **数据库连接失败**
   - 检查 Docker 容器是否正常运行: `docker compose ps`
   - 检查数据库密码是否正确
   - 重新导入种子数据

4. **前端编译错误**
   - 删除 node_modules 重新安装: `rm -rf node_modules && npm install`
   - 检查 TypeScript 类型错误: `npm run type-check`

5. **后端编译失败**
   - 检查 Java 版本（需要 JDK 17+）
   - 清理 Maven 缓存: `mvn clean`
   - 检查依赖版本冲突

### 日志查看
- **后端日志**: 控制台输出或日志文件
- **前端日志**: Vite 开发服务器控制台
- **Docker 日志**: `docker compose logs -f`

---

## 智能判断逻辑

本技能会根据代码改动智能决定操作：

1. **后端代码改动** (`.java` 文件)
   - 需要重新编译: `mvn clean package`
   - 需要重启后端

2. **前端代码改动** (`.tsx`, `.ts`, `.css`, `.json` 文件)
   - Vite HMR 自动热更新，无需重启
   - 修改 `package.json` 需要重新安装依赖: `npm install`
   - 修改 `vite.config.ts` 需要重启前端服务

3. **数据库改动** (`.sql` 文件)
   - 需要执行 SQL 脚本或重新导入种子数据

4. **配置文件改动** (`application.yml`, `vite.config.ts`)
   - 需要重启对应服务

5. **端口冲突处理**
   - 前端端口 5173 被占用时自动切换到 5174
   - 后端端口 8081 固定（避免与 Apache httpd 8080 冲突）
   - PostgreSQL 端口 5433（Docker映射 5433→5432）
   - Redis 端口 6380（Docker映射 6380→6379）
