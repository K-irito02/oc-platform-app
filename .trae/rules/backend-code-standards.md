---
alwaysApply: true
---
# 后端代码规范

## 静态分析

- **SonarQube**: 代码质量静态分析
  - 代码覆盖率 ≥ 80%
  - 重复率 ≤ 3%
  - 技术债务控制在 A 级
  - 安全热点必须修复

## 代码规范

- **Checkstyle**: 使用 Google Java Style 规范
  - 缩进：2 个空格
  - 行长度：100 字符
  - 导入顺序：static → 第三方 → 项目内
  - 方法长度 ≤ 50 行
  - 类长度 ≤ 500 行

## 代码格式化

- **Spotless**: 自动代码格式化
  - Google Java Format
  - Import 排序和去重
  - 文件末尾换行符
  - 移除未使用的导入

## 依赖安全

- **OWASP Dependency-Check**: 依赖漏洞扫描
  - 构建时自动扫描
  - 高危漏洞必须修复
  - 定期更新依赖版本
  - 维护依赖白名单

## 测试规范

- **JaCoCo**: 测试覆盖率 ≥ 80%
  - 单元测试：JUnit 5 + Mockito
  - 集成测试：@SpringBootTest
  - 测试命名：should_ExpectedBehavior_When_StateUnderTest
  - 测试方法必须是 public void

## 代码审查清单

1. **命名规范**
   - 类名：PascalCase
   - 方法名：camelCase
   - 常量：UPPER_SNAKE_CASE
   - 包名：lowercase

2. **设计原则**
   - 单一职责原则
   - 开闭原则
   - 依赖倒置原则
   - 接口隔离原则

3. **Spring Boot 特定规范**
   - Controller 只处理 HTTP 请求
   - Service 处理业务逻辑
   - Repository 只处理数据访问
   - 使用 @Autowired 构造器注入

4. **异常处理**
   - 自定义业务异常
   - 统一异常处理 @ControllerAdvice
   - 日志记录异常堆栈
   - 返回标准错误格式

## 性能要求

- 数据库查询避免 N+1 问题
- 合理使用缓存 @Cacheable
- 异步处理使用 @Async
- 避免在循环中进行数据库操作
