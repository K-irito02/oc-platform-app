package com.qtplatform.file.controller;

import com.qtplatform.common.response.ApiResponse;
import com.qtplatform.file.entity.FileRecord;
import com.qtplatform.file.repository.FileRecordMapper;
import com.qtplatform.file.service.FileStorageService;
import com.qtplatform.file.service.MinioStorageService;
import io.minio.StatObjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final MinioStorageService minioStorageService;
    private final FileRecordMapper fileRecordMapper;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "general") String type,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        FileRecord record = fileStorageService.uploadFile(file, userId, type);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "originalName", record.getOriginalName(),
                "filePath", record.getFilePath(),
                "fileSize", record.getFileSize(),
                "mimeType", record.getMimeType() != null ? record.getMimeType() : "",
                "checksumSha256", record.getChecksumSha256()
        ));
    }

    @PostMapping("/upload/avatar")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        FileRecord record = minioStorageService.uploadAvatar(file, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "url", record.getFileUrl(),
                "originalName", record.getOriginalName()
        ));
    }

    @PostMapping("/upload/product-image")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadProductImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") Long productId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        FileRecord record = minioStorageService.uploadProductImage(file, productId, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "url", record.getFileUrl(),
                "originalName", record.getOriginalName()
        ));
    }

    @PostMapping("/upload/product-video")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadProductVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") Long productId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        FileRecord record = minioStorageService.uploadProductVideo(file, productId, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "url", record.getFileUrl(),
                "originalName", record.getOriginalName()
        ));
    }

    @PostMapping("/upload/product-download")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadProductDownload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") Long productId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        FileRecord record = minioStorageService.uploadProductDownload(file, productId, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "filePath", record.getFilePath(),
                "fileSize", record.getFileSize(),
                "originalName", record.getOriginalName(),
                "checksumSha256", record.getChecksumSha256()
        ));
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable Long fileId) {
        FileRecord record = fileRecordMapper.selectById(fileId);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }

        String bucket = record.getBucketName();
        String objectName = record.getFilePath();
        
        if (!"MINIO".equals(record.getStorageType())) {
            return ResponseEntity.badRequest().build();
        }

        StatObjectResponse stat = minioStorageService.getFileInfo(bucket, objectName);
        InputStream inputStream = minioStorageService.downloadFile(bucket, objectName);

        String encodedFileName = URLEncoder.encode(record.getOriginalName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(stat.size())
                .body(new InputStreamResource(inputStream));
    }

    @GetMapping("/download-url/{fileId}")
    public ApiResponse<Map<String, String>> getDownloadUrl(
            @PathVariable Long fileId,
            @RequestParam(value = "expiry", defaultValue = "60") int expiryMinutes) {
        FileRecord record = fileRecordMapper.selectById(fileId);
        if (record == null || !"MINIO".equals(record.getStorageType())) {
            return ApiResponse.error(404, "文件不存在");
        }

        String url = minioStorageService.getPresignedDownloadUrl(
                record.getBucketName(), record.getFilePath(), expiryMinutes);
        return ApiResponse.success(Map.of(
                "url", url,
                "fileName", record.getOriginalName(),
                "fileSize", String.valueOf(record.getFileSize())
        ));
    }

    @PostMapping("/upload/image")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        // 使用 MinIO 存储图片
        FileRecord record = minioStorageService.uploadProductImage(file, null, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "url", record.getFileUrl(),
                "originalName", record.getOriginalName()
        ));
    }

    @PostMapping("/upload/video")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        // 使用 MinIO 存储视频
        FileRecord record = minioStorageService.uploadProductVideo(file, null, userId);
        return ApiResponse.success(Map.of(
                "id", record.getId(),
                "url", record.getFileUrl(),
                "originalName", record.getOriginalName()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteFile(@PathVariable Long id) {
        FileRecord record = fileRecordMapper.selectById(id);
        if (record != null && "MINIO".equals(record.getStorageType())) {
            minioStorageService.deleteFile(record.getBucketName(), record.getFilePath());
            fileRecordMapper.deleteById(id);
        } else {
            fileStorageService.deleteFile(id);
        }
        return ApiResponse.success();
    }
}
