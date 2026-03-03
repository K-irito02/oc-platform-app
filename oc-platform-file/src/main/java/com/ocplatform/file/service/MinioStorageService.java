package com.ocplatform.file.service;

import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.file.config.MinioConfig;
import com.ocplatform.file.entity.FileRecord;
import com.ocplatform.file.repository.FileRecordMapper;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioStorageService {

    private final MinioClient minioClient;
    private final MinioConfig minioConfig;
    private final FileRecordMapper fileRecordMapper;

    @PostConstruct
    public void init() {
        createBucketIfNotExists(minioConfig.getBucketAvatars());
        createBucketIfNotExists(minioConfig.getBucketProducts());
        createBucketIfNotExists(minioConfig.getBucketVideos());
        createBucketIfNotExists(minioConfig.getBucketDownloads());
    }

    private void createBucketIfNotExists(String bucketName) {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                // 设置 bucket 为公开读（用于图片和视频预览）
                if (!bucketName.equals(minioConfig.getBucketDownloads())) {
                    String policy = """
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {"AWS": ["*"]},
                                    "Action": ["s3:GetObject"],
                                    "Resource": ["arn:aws:s3:::%s/*"]
                                }
                            ]
                        }
                        """.formatted(bucketName);
                    minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                            .bucket(bucketName)
                            .config(policy)
                            .build());
                }
                log.info("Created MinIO bucket: {}", bucketName);
            }
        } catch (Exception e) {
            log.error("Failed to create bucket: {}", bucketName, e);
        }
    }

    public FileRecord uploadAvatar(MultipartFile file, Long userId) {
        return uploadFile(file, minioConfig.getBucketAvatars(), "user_" + userId, userId);
    }

    public FileRecord uploadProductImage(MultipartFile file, Long productId, Long userId) {
        String prefix = productId != null ? "product_" + productId + "/images" : "temp/images";
        return uploadFile(file, minioConfig.getBucketProducts(), prefix, userId);
    }

    public FileRecord uploadProductVideo(MultipartFile file, Long productId, Long userId) {
        String prefix = productId != null ? "product_" + productId : "temp/videos";
        return uploadFile(file, minioConfig.getBucketVideos(), prefix, userId);
    }

    public FileRecord uploadProductDownload(MultipartFile file, Long productId, Long userId) {
        return uploadFile(file, minioConfig.getBucketDownloads(), "product_" + productId, userId);
    }

    public FileRecord uploadFile(MultipartFile file, String bucket, String prefix, Long uploadedBy) {
        validateFile(file);

        try {
            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String storedName = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String objectName = (prefix != null ? prefix + "/" : "") + datePath + "/" + storedName;

            // 计算 SHA256
            String sha256 = calculateSha256(file.getInputStream());

            // 上传到 MinIO
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            // 生成访问 URL
            String fileUrl = minioConfig.getEndpoint() + "/" + bucket + "/" + objectName;

            // 保存文件记录
            FileRecord record = FileRecord.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .filePath(objectName)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .checksumSha256(sha256)
                    .storageType("MINIO")
                    .bucketName(bucket)
                    .fileUrl(fileUrl)
                    .uploadedBy(uploadedBy)
                    .build();
            fileRecordMapper.insert(record);

            log.info("File uploaded to MinIO: {} -> {}/{} (size={})", originalName, bucket, objectName, formatFileSize(file.getSize()));
            return record;

        } catch (Exception e) {
            log.error("File upload to MinIO failed", e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED, "文件上传失败: " + e.getMessage());
        }
    }

    public InputStream downloadFile(String bucket, String objectName) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.error("File download from MinIO failed: {}/{}", bucket, objectName, e);
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "文件下载失败");
        }
    }

    public String getPresignedDownloadUrl(String bucket, String objectName, int expiryMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(objectName)
                    .expiry(expiryMinutes, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}/{}", bucket, objectName, e);
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "生成下载链接失败");
        }
    }

    public void deleteFile(String bucket, String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
            log.info("File deleted from MinIO: {}/{}", bucket, objectName);
        } catch (Exception e) {
            log.error("File deletion from MinIO failed: {}/{}", bucket, objectName, e);
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "文件删除失败");
        }
    }

    public StatObjectResponse getFileInfo(String bucket, String objectName) {
        try {
            return minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.error("Failed to get file info: {}/{}", bucket, objectName, e);
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "文件不能为空");
        }
        // 最大 1GB
        if (file.getSize() > 1073741824L) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE, "文件大小不能超过 1GB");
        }
    }

    private String calculateSha256(InputStream inputStream) throws NoSuchAlgorithmException, IOException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, read);
        }
        byte[] hash = digest.digest();
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "";
    }

    private String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.2f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.2f MB", size / (1024.0 * 1024));
        return String.format("%.2f GB", size / (1024.0 * 1024 * 1024));
    }
}
