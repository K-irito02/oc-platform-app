-- ============================================================
-- 重置产品数据 - 删除模拟产品，插入真实产品
-- ============================================================

-- 删除旧的模拟产品相关数据
DELETE FROM product_comments WHERE product_id IN (
    SELECT id FROM products WHERE slug IN (
        'qtcreator-pro', 'ink-draw', 'net-monitor', 'music-box', 
        'sys-info', 'code-teach', 'filesync-pro', 'pixel-editor',
        'docker-desktop', 'windsurf-editor'
    )
);

DELETE FROM product_versions WHERE product_id IN (
    SELECT id FROM products WHERE slug IN (
        'qtcreator-pro', 'ink-draw', 'net-monitor', 'music-box', 
        'sys-info', 'code-teach', 'filesync-pro', 'pixel-editor',
        'docker-desktop', 'windsurf-editor'
    )
);

DELETE FROM products WHERE slug IN (
    'qtcreator-pro', 'ink-draw', 'net-monitor', 'music-box', 
    'sys-info', 'code-teach', 'filesync-pro', 'pixel-editor',
    'docker-desktop', 'windsurf-editor'
);

-- ============================================================
-- 插入真实产品: Docker Desktop
-- ============================================================
INSERT INTO products (
    name, name_en, slug, description, description_en, 
    category_id, developer_id, status,
    icon_url, banner_url, screenshots, demo_video_url,
    homepage_url, source_url, license,
    download_count, view_count, rating_average, rating_count,
    is_featured, tags, published_at
) VALUES (
    'Docker Desktop',
    'Docker Desktop',
    'docker-desktop',
    '# Docker Desktop

Docker Desktop 是一款面向 Mac、Linux 和 Windows 的一体化容器化应用程序，提供简单易用的图形界面来管理容器、应用程序和镜像。

## 主要功能

- **容器管理**: 轻松创建、运行和管理 Docker 容器
- **Kubernetes 集成**: 内置 Kubernetes 支持，一键启用
- **开发环境**: 完整的开发环境，支持 Docker Compose
- **跨平台**: 支持 Windows、macOS 和 Linux
- **Docker Hub**: 无缝集成 Docker Hub，轻松拉取和推送镜像

## 系统要求

- Windows 10/11 64位（专业版、企业版或教育版）
- 4GB 系统内存
- 启用 BIOS 虚拟化
- WSL 2 后端（推荐）

## 为什么选择 Docker Desktop

Docker Desktop 简化了容器化开发流程，让开发者可以专注于编写代码，而不是配置环境。无论是微服务架构、CI/CD 流水线还是本地开发测试，Docker Desktop 都是理想的选择。',
    '# Docker Desktop

Docker Desktop is an all-in-one containerization application for Mac, Linux, and Windows that provides an easy-to-use graphical interface for managing containers, applications, and images.

## Key Features

- **Container Management**: Easily create, run and manage Docker containers
- **Kubernetes Integration**: Built-in Kubernetes support, one-click enable
- **Development Environment**: Complete development environment with Docker Compose support
- **Cross-Platform**: Supports Windows, macOS and Linux
- **Docker Hub**: Seamless integration with Docker Hub for easy image pull and push

## System Requirements

- Windows 10/11 64-bit (Pro, Enterprise, or Education)
- 4GB system memory
- BIOS virtualization enabled
- WSL 2 backend (recommended)

## Why Choose Docker Desktop

Docker Desktop simplifies the containerized development workflow, allowing developers to focus on writing code rather than configuring environments. Whether it''s microservices architecture, CI/CD pipelines, or local development testing, Docker Desktop is the ideal choice.',
    (SELECT id FROM categories WHERE slug = 'dev-tools'),
    (SELECT id FROM users WHERE username = 'admin'),
    'PUBLISHED',
    'http://localhost:9000/products/docker-desktop/icon.png',
    'http://localhost:9000/products/docker-desktop/banner.jpg',
    '["http://localhost:9000/products/docker-desktop/screenshot-1.jpg", "http://localhost:9000/products/docker-desktop/screenshot-2.jpg", "http://localhost:9000/products/docker-desktop/screenshot-3.jpg"]',
    'http://localhost:9000/videos/docker-demo.mp4',
    'https://www.docker.com/products/docker-desktop',
    'https://github.com/docker/for-win',
    'Apache-2.0',
    15280, 45020, 4.8, 128, true,
    ARRAY['容器', 'Docker', 'DevOps', '开发工具', '虚拟化'],
    NOW() - INTERVAL '3 months'
);

-- Docker Desktop 版本
INSERT INTO product_versions (
    product_id, version_number, version_code, version_type, 
    platform, architecture, min_os_version,
    file_name, file_size, file_path, checksum_sha256,
    download_count, is_mandatory, is_latest, status, rollout_percentage,
    release_notes, release_notes_en, published_at
) VALUES (
    (SELECT id FROM products WHERE slug = 'docker-desktop'),
    '4.37.0', 4370000, 'RELEASE', 'WINDOWS', 'x64', 'Windows 10',
    'Docker Desktop Installer.exe', 655537072,
    'downloads/docker-desktop/Docker Desktop Installer.exe',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    12580, false, true, 'PUBLISHED', 100,
    '## 更新内容

- 修复已知问题
- 性能优化
- 安全更新
- 改进 WSL 2 集成
- 更新 Docker Engine 到最新版本',
    '## What''s New

- Bug fixes
- Performance improvements
- Security updates
- Improved WSL 2 integration
- Updated Docker Engine to latest version',
    NOW() - INTERVAL '1 week'
);

-- ============================================================
-- 插入真实产品: Windsurf Editor
-- ============================================================
INSERT INTO products (
    name, name_en, slug, description, description_en,
    category_id, developer_id, status,
    icon_url, banner_url, screenshots, demo_video_url,
    homepage_url, license,
    download_count, view_count, rating_average, rating_count,
    is_featured, tags, published_at
) VALUES (
    'Windsurf Editor',
    'Windsurf Editor',
    'windsurf-editor',
    '# Windsurf Editor

Windsurf 是新一代 AI 驱动的代码编辑器，专为现代开发者打造。基于 VS Code 内核，提供熟悉的操作方式和强大的 AI 辅助功能。

## 核心特性

- **AI 代码助手 (Cascade)**: 智能代码补全、代码生成、重构建议
- **流畅编辑体验**: 基于 VS Code 内核，熟悉的操作方式
- **多语言支持**: 支持所有主流编程语言
- **插件生态**: 兼容大部分 VS Code 扩展
- **智能搜索**: AI 驱动的代码搜索和导航

## 为什么选择 Windsurf

- 比传统 IDE 更快的启动速度
- 内置 AI 助手，提升编码效率 10 倍以上
- 现代化的用户界面，支持自定义主题
- 实时协作功能
- 持续更新，每周发布新版本

## 系统要求

- Windows 10/11 64位
- macOS 10.15+
- Linux (Ubuntu 18.04+)
- 8GB RAM（推荐 16GB）
- 2GB 可用磁盘空间',
    '# Windsurf Editor

Windsurf is a next-generation AI-powered code editor built for modern developers. Based on VS Code core, it provides familiar operations and powerful AI assistance.

## Core Features

- **AI Code Assistant (Cascade)**: Intelligent code completion, code generation, refactoring suggestions
- **Smooth Editing Experience**: Based on VS Code core, familiar operations
- **Multi-Language Support**: Supports all major programming languages
- **Plugin Ecosystem**: Compatible with most VS Code extensions
- **Smart Search**: AI-powered code search and navigation

## Why Choose Windsurf

- Faster startup than traditional IDEs
- Built-in AI assistant to boost coding efficiency by 10x
- Modern user interface with custom theme support
- Real-time collaboration features
- Continuous updates with weekly releases

## System Requirements

- Windows 10/11 64-bit
- macOS 10.15+
- Linux (Ubuntu 18.04+)
- 8GB RAM (16GB recommended)
- 2GB available disk space',
    (SELECT id FROM categories WHERE slug = 'dev-tools'),
    (SELECT id FROM users WHERE username = 'admin'),
    'PUBLISHED',
    'http://localhost:9000/products/windsurf/icon.png',
    'http://localhost:9000/products/windsurf/banner.jpg',
    '["http://localhost:9000/products/windsurf/screenshot-1.jpg", "http://localhost:9000/products/windsurf/screenshot-2.jpg"]',
    'http://localhost:9000/videos/windsurf-demo.mp4',
    'https://windsurf.ai',
    'Proprietary',
    8520, 32100, 4.9, 256, true,
    ARRAY['IDE', 'AI', '代码编辑器', '开发工具', 'VS Code'],
    NOW() - INTERVAL '2 months'
);

-- Windsurf 版本
INSERT INTO product_versions (
    product_id, version_number, version_code, version_type,
    platform, architecture, min_os_version,
    file_name, file_size, file_path, checksum_sha256,
    download_count, is_mandatory, is_latest, status, rollout_percentage,
    release_notes, release_notes_en, published_at
) VALUES (
    (SELECT id FROM products WHERE slug = 'windsurf-editor'),
    '1.9544.35', 1954435, 'RELEASE', 'WINDOWS', 'x64', 'Windows 10',
    'WindsurfUserSetup-x64-1.9544.35.exe', 168680912,
    'downloads/windsurf/WindsurfUserSetup-x64-1.9544.35.exe',
    'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
    6420, false, true, 'PUBLISHED', 100,
    '## 更新内容

- AI 助手能力大幅提升
- 新增代码审查功能
- UI 界面优化
- 修复多项已知问题
- 提升启动速度',
    '## What''s New

- Significantly enhanced AI assistant capabilities
- New code review feature
- UI improvements
- Fixed multiple known issues
- Improved startup speed',
    NOW() - INTERVAL '3 days'
);

-- ============================================================
-- 添加测试评论
-- ============================================================
INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    'Docker Desktop 是开发必备工具，容器化开发变得非常简单！', 5, 'PUBLISHED', 45
FROM products p, users u WHERE p.slug = 'docker-desktop' AND u.username = 'zhangsan';

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    'WSL 2 集成非常流畅，在 Windows 上开发容器应用和 Linux 一样方便。', 5, 'PUBLISHED', 32
FROM products p, users u WHERE p.slug = 'docker-desktop' AND u.username = 'lisi';

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    'Windsurf 的 AI 功能太强大了，Cascade 助手能理解整个项目上下文！', 5, 'PUBLISHED', 67
FROM products p, users u WHERE p.slug = 'windsurf-editor' AND u.username = 'zhangsan';

INSERT INTO product_comments (product_id, user_id, content, rating, status, like_count)
SELECT p.id, u.id,
    '代码补全速度很快，比 Copilot 更智能，强烈推荐给开发者。', 5, 'PUBLISHED', 48
FROM products p, users u WHERE p.slug = 'windsurf-editor' AND u.username = 'wangwu';

-- 完成
SELECT '产品数据重置完成！' AS result;
SELECT id, name, slug, status FROM products;
