-- ============================================================
-- 示例产品数据 - 用于测试 MinIO 文件下载功能
-- ============================================================

-- 插入示例产品: Docker Desktop
INSERT INTO products (
    name, name_en, slug, description, description_en, category_id, developer_id,
    status, icon_url, banner_url, screenshots, demo_video_url,
    homepage_url, source_url, license, download_count, view_count, 
    rating_average, rating_count, is_featured, tags, published_at
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

## 系统要求

- Windows 10/11 64位（专业版、企业版或教育版）
- 4GB 系统内存
- 启用 BIOS 虚拟化',
    '# Docker Desktop

Docker Desktop is an all-in-one containerization application for Mac, Linux, and Windows that provides an easy-to-use graphical interface for managing containers, applications, and images.

## Key Features

- **Container Management**: Easily create, run and manage Docker containers
- **Kubernetes Integration**: Built-in Kubernetes support, one-click enable
- **Development Environment**: Complete development environment with Docker Compose support
- **Cross-Platform**: Supports Windows, macOS and Linux

## System Requirements

- Windows 10/11 64-bit (Pro, Enterprise, or Education)
- 4GB system memory
- BIOS virtualization enabled',
    1, 1, 'PUBLISHED',
    'http://localhost:9000/products/docker-desktop/icon.png',
    'http://localhost:9000/products/docker-desktop/banner.png',
    '["http://localhost:9000/products/docker-desktop/screenshot-1.jpg", "http://localhost:9000/products/docker-desktop/screenshot-2.jpg"]',
    'http://localhost:9000/videos/docker-demo.mp4',
    'https://www.docker.com/products/docker-desktop',
    'https://github.com/docker/for-win',
    'Apache-2.0',
    15280, 45020, 4.8, 128, true,
    ARRAY['容器', 'Docker', 'DevOps', '开发工具'],
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 插入示例产品: Windsurf Editor
INSERT INTO products (
    name, name_en, slug, description, description_en, category_id, developer_id,
    status, icon_url, banner_url, screenshots, demo_video_url,
    homepage_url, license, download_count, view_count, 
    rating_average, rating_count, is_featured, tags, published_at
) VALUES (
    'Windsurf Editor',
    'Windsurf Editor',
    'windsurf-editor',
    '# Windsurf Editor

Windsurf 是新一代 AI 驱动的代码编辑器，专为现代开发者打造。

## 核心特性

- **AI 代码助手**: 智能代码补全和生成
- **流畅编辑体验**: 基于 VS Code 内核，熟悉的操作方式
- **多语言支持**: 支持所有主流编程语言
- **插件生态**: 兼容 VS Code 扩展

## 为什么选择 Windsurf

- 比传统 IDE 更快的启动速度
- 内置 AI 助手，提升编码效率
- 现代化的用户界面',
    '# Windsurf Editor

Windsurf is a next-generation AI-powered code editor built for modern developers.

## Core Features

- **AI Code Assistant**: Intelligent code completion and generation
- **Smooth Editing Experience**: Based on VS Code core, familiar operations
- **Multi-Language Support**: Supports all major programming languages
- **Plugin Ecosystem**: Compatible with VS Code extensions

## Why Choose Windsurf

- Faster startup than traditional IDEs
- Built-in AI assistant to boost coding efficiency
- Modern user interface',
    1, 1, 'PUBLISHED',
    'http://localhost:9000/products/windsurf/icon.png',
    'http://localhost:9000/products/windsurf/banner.png',
    '["http://localhost:9000/products/windsurf/screenshot-1.jpg"]',
    'http://localhost:9000/videos/windsurf-demo.mp4',
    'https://windsurf.ai',
    'Proprietary',
    8520, 32100, 4.9, 256, true,
    ARRAY['IDE', 'AI', '代码编辑器', '开发工具'],
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 获取产品 ID
DO $$
DECLARE
    docker_id BIGINT;
    windsurf_id BIGINT;
BEGIN
    SELECT id INTO docker_id FROM products WHERE slug = 'docker-desktop';
    SELECT id INTO windsurf_id FROM products WHERE slug = 'windsurf-editor';

    -- Docker Desktop 版本
    IF docker_id IS NOT NULL THEN
        INSERT INTO product_versions (
            product_id, version_number, version_code, version_type, platform, architecture,
            min_os_version, file_name, file_size, file_path, checksum_sha256,
            download_count, is_mandatory, is_latest, status, rollout_percentage,
            release_notes, release_notes_en, published_at
        ) VALUES (
            docker_id, '4.37.0', 4370000, 'RELEASE', 'WINDOWS', 'x64',
            'Windows 10', 'Docker Desktop Installer.exe', 655537072,
            'downloads/product_' || docker_id || '/Docker Desktop Installer.exe',
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            12580, false, true, 'PUBLISHED', 100,
            '## 更新内容\n- 修复已知问题\n- 性能优化\n- 安全更新',
            '## What''s New\n- Bug fixes\n- Performance improvements\n- Security updates',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- Windsurf 版本
    IF windsurf_id IS NOT NULL THEN
        INSERT INTO product_versions (
            product_id, version_number, version_code, version_type, platform, architecture,
            min_os_version, file_name, file_size, file_path, checksum_sha256,
            download_count, is_mandatory, is_latest, status, rollout_percentage,
            release_notes, release_notes_en, published_at
        ) VALUES (
            windsurf_id, '1.9544.35', 1954435, 'RELEASE', 'WINDOWS', 'x64',
            'Windows 10', 'WindsurfUserSetup-x64-1.9544.35.exe', 168680912,
            'downloads/product_' || windsurf_id || '/WindsurfUserSetup-x64-1.9544.35.exe',
            'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
            6420, false, true, 'PUBLISHED', 100,
            '## 更新内容\n- AI 助手能力提升\n- 新增代码审查功能\n- UI 优化',
            '## What''s New\n- Enhanced AI assistant capabilities\n- New code review feature\n- UI improvements',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
