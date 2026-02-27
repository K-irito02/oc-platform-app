---
alwaysApply: true
---
# 技术栈选型规范

## 阶段一技术栈

### 前端技术栈

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | React + TypeScript | 18.2.0+ | SPA 单页应用 |
| **状态管理** | Redux Toolkit + RTK Query | 2.x | 含异步请求管理与自动缓存 |
| **UI 组件库** | Ant Design | 5.x | 定制主题 |
| **构建工具** | Vite | 5.x | 快速 HMR，开发体验好 |
| **样式方案** | CSS Modules + Ant Design Token | — | 主题变量统一管理 |
| **国际化** | react-i18next | 14.x | 中 / 英双语 |
| **前端路由** | React Router | 6.x | 嵌套路由 + 懒加载 |
| **SEO** | react-helmet-async | 2.x | Meta 标签 + 结构化数据 |

### 后端技术栈

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **后端框架** | Spring Boot | 3.2.x | Java 17 LTS |
| **ORM** | MyBatis-Plus + Spring Data JPA | 混合 | 复杂 SQL 用 MyBatis，简单 CRUD 用 JPA |
| **安全** | Spring Security | 6.2.x | JWT + RBAC |
| **API 文档** | SpringDoc OpenAPI | 2.x | Swagger UI 自动生成 |
| **校验** | Bean Validation (Hibernate Validator) | 3.x | 参数校验 |
| **邮件** | Spring Boot Mail | — | 验证码/通知邮件 |

### 基础设施

| 层次 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **主数据库** | PostgreSQL | 15.x | JSONB + 全文检索 + 表分区 |
| **缓存** | Redis | 7.x | 单机模式（MVP 阶段） |
| **容器化** | Docker + Docker Compose | — | 本地开发 + 生产部署 |
| **反向代理** | Nginx | alpine | SSL 终止 + 静态资源 + 限流 |
| **CI/CD** | GitHub Actions | — | 自动构建/测试/部署 |
| **监控** | Spring Boot Actuator + Prometheus + Grafana | — | 基础指标采集 |
| **日志** | Logback + JSON 格式 | — | 阶段一用文件日志，阶段二接入 ELK |

## 技术选型原则

### 1. 成熟稳定优先
- 选择 LTS 版本或稳定版本
- 避免使用 beta 或实验性功能
- 社区活跃度和文档完整性
- 生产环境验证案例

### 2. 生态兼容性
- 技术栈之间的兼容性
- 版本依赖关系清晰
- 避免版本冲突
- 便于后续升级维护

### 3. 团队熟悉度
- 考虑团队技术背景
- 学习成本合理
- 招聘市场人才储备
- 技术社区支持度

### 4. 运维友好性
- 容器化支持程度
- 监控和日志工具
- 故障排查便利性
- 扩展和伸缩能力

## 版本管理策略

### 依赖版本锁定

```xml
<!-- Maven 依赖版本管理 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.12</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 前端包版本管理

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  }
}
```

## 技术债务管理

### 评估标准

1. **安全风险**: 已知漏洞和安全隐患
2. **维护成本**: 版本更新频率和复杂度
3. **性能影响**: 技术选型对系统性能的影响
4. **开发效率**: 对团队开发效率的影响

### 升级策略

- 定期评估技术栈版本
- 制定升级时间表和计划
- 测试环境验证升级效果
- 生产环境灰度发布

## 技术选型决策流程

### 1. 需求分析
- 功能需求分析
- 非功能需求分析
- 性能和扩展性要求
- 安全和合规要求

### 2. 技术调研
- 候选技术对比分析
- POC 验证关键特性
- 社区和生态调研
- 成本效益分析

### 3. 决策评审
- 技术评审会议
- 风险评估报告
- 实施计划制定
- 团队培训安排

### 4. 实施监控
- 技术选型效果跟踪
- 问题收集和反馈
- 持续优化改进
- 经验总结沉淀

## 特殊说明

### Redis 单机模式
阶段一使用 Redis 单机模式而非哨兵，降低运维复杂度。待用户量增长后再考虑集群方案。

### 消息队列替代
阶段一使用 Spring `@Async` 替代消息队列（RabbitMQ），避免引入过多中间件。后续根据业务需要再引入。

### 数据库选择
PostgreSQL 15.x 提供 JSONB 支持和全文检索能力，满足阶段一的业务需求，同时具备良好的扩展性。

### 监控方案
阶段一使用基础监控方案，阶段二根据需要接入完整的 APM 和日志分析系统。
