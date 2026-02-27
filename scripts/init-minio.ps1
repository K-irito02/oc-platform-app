# MinIO 初始化脚本
# 用于创建 bucket 并上传测试文件

$ErrorActionPreference = "Stop"

# MinIO 配置
$MINIO_ENDPOINT = "http://localhost:9000"
$MINIO_ACCESS_KEY = "minioadmin"
$MINIO_SECRET_KEY = "3143285505"
$MINIO_ALIAS = "qtminio"

# 测试文件目录
$TEST_FILES_DIR = "E:\oc\Front-end testing"

Write-Host "=== MinIO 初始化脚本 ===" -ForegroundColor Cyan

# 检查 mc (MinIO Client) 是否安装
$mcPath = Get-Command mc -ErrorAction SilentlyContinue
if (-not $mcPath) {
    Write-Host "MinIO Client (mc) 未安装，正在下载..." -ForegroundColor Yellow
    $mcUrl = "https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
    $mcDest = "$env:USERPROFILE\mc.exe"
    Invoke-WebRequest -Uri $mcUrl -OutFile $mcDest
    $env:PATH += ";$env:USERPROFILE"
    Write-Host "MinIO Client 已下载到 $mcDest" -ForegroundColor Green
}

# 配置 MinIO 别名
Write-Host "`n配置 MinIO 连接..." -ForegroundColor Cyan
mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# 创建 bucket
Write-Host "`n创建存储桶..." -ForegroundColor Cyan
$buckets = @("avatars", "products", "videos", "downloads")
foreach ($bucket in $buckets) {
    mc mb "$MINIO_ALIAS/$bucket" --ignore-existing
    mc anonymous set download "$MINIO_ALIAS/$bucket"
    Write-Host "  ✓ $bucket" -ForegroundColor Green
}

# 上传测试图片到 products bucket
Write-Host "`n上传测试图片..." -ForegroundColor Cyan
$imageDir = "$TEST_FILES_DIR\Image"
if (Test-Path $imageDir) {
    $images = Get-ChildItem -Path $imageDir -Filter "*.jpg"
    foreach ($img in $images) {
        mc cp $img.FullName "$MINIO_ALIAS/products/"
        Write-Host "  ✓ $($img.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  图片目录不存在: $imageDir" -ForegroundColor Yellow
}

# 上传测试视频到 videos bucket
Write-Host "`n上传测试视频..." -ForegroundColor Cyan
$videoDir = "$TEST_FILES_DIR\Video"
if (Test-Path $videoDir) {
    $videos = Get-ChildItem -Path $videoDir -Filter "*.mp4"
    foreach ($vid in $videos) {
        mc cp $vid.FullName "$MINIO_ALIAS/videos/"
        Write-Host "  ✓ $($vid.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  视频目录不存在: $videoDir" -ForegroundColor Yellow
}

# 上传测试应用程序到 downloads bucket
Write-Host "`n上传测试应用程序..." -ForegroundColor Cyan
$appDir = "$TEST_FILES_DIR\Application"
if (Test-Path $appDir) {
    $apps = Get-ChildItem -Path $appDir -Filter "*.exe"
    foreach ($app in $apps) {
        mc cp $app.FullName "$MINIO_ALIAS/downloads/"
        Write-Host "  ✓ $($app.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  应用程序目录不存在: $appDir" -ForegroundColor Yellow
}

# 列出所有上传的文件
Write-Host "`n=== 上传完成 ===" -ForegroundColor Cyan
Write-Host "访问 MinIO Console: http://localhost:9001" -ForegroundColor Yellow
Write-Host "用户名: minioadmin" -ForegroundColor Yellow
Write-Host "密码: 3143285505" -ForegroundColor Yellow

Write-Host "`n文件列表:" -ForegroundColor Cyan
foreach ($bucket in $buckets) {
    Write-Host "`n[$bucket]" -ForegroundColor Magenta
    mc ls "$MINIO_ALIAS/$bucket"
}
