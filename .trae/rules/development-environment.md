---
alwaysApply: true
---
# 开发环境搭建说明

## 软件安装清单

| 软件 | 版本 | 安装方式 | 用途 |
|------|------|---------|------|
| **JDK** | OpenJDK 21 (Temurin) | [adoptium.net](https://adoptium.net) | 后端运行环境 |
| **Node.js** | 22.x LTS | nvm-windows 管理 | 前端运行环境 |
| **Docker Desktop** | Latest | 官网安装，启用 WSL2 | 容器化开发 |
| **Git** | Latest | 官网安装 | 版本控制 |
| **IntelliJ IDEA** | Ultimate (推荐) | JetBrains | 后端 IDE |
| **Postman** | Latest | 官网安装 | API 调试 |

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| **后端 API** | 8081 | Spring Boot 应用 |
| **前端开发** | 5173 | Vite 开发服务器 |
| **PostgreSQL** | 5432 | 数据库服务 |
| **Redis** | 6379 | 缓存服务 |
| **Nginx** | 80 | 反向代理（生产） |

> **注意**: 本机 Apache httpd 占用 8080 端口，后端改用 8081

## 开发工具配置

### Postman 配置

1. **导入 API 文档**
   - 访问 `http://localhost:8081/swagger-ui.html`
   - 导出 OpenAPI 规范
   - 导入到 Postman

2. **环境变量**
   ```json
   {
     "name": "Development",
     "values": [
       {
         "key": "baseUrl",
         "value": "http://localhost:8081/api/v1"
       }
     ]
   }
   ```

## 常见问题解决

### 1. Maven 依赖下载慢

```xml
<!-- 在 settings.xml 中配置镜像 -->
<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>central</mirrorOf>
    <name>Aliyun Maven Mirror</name>
    <url>https://maven.aliyun.com/repository/central</url>
  </mirror>
</mirrors>
```

### 2. Node.js 依赖安装失败

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 3. Docker 容器启动失败

```bash
# 检查 Docker 服务状态
docker info

# 重启 Docker Desktop
# 清理未使用的容器和镜像
docker system prune
```

### 4. 端口占用问题

```bash
# Windows 查看端口占用
netstat -ano | findstr :8081

# 结束占用进程
taskkill /PID <PID> /F
```