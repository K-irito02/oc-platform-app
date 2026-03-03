package com.ocplatform.file.service;

import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.util.FileUtil;
import com.ocplatform.file.config.StorageConfig;
import com.ocplatform.file.entity.FileRecord;
import com.ocplatform.file.repository.FileRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final StorageConfig storageConfig;
    private final FileRecordMapper fileRecordMapper;

    @PostConstruct
    public void init() throws IOException {
        FileUtil.ensureDirectoryExists(storageConfig.getUploadPath());
    }

    public FileRecord uploadFile(MultipartFile file, Long uploadedBy, String subDir) {
        validateFile(file);

        try {
            String originalName = file.getOriginalFilename();
            String storedName = FileUtil.generateStoredName(originalName);
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String relativePath = (subDir != null ? subDir + "/" : "") + datePath;
            Path dirPath = Paths.get(storageConfig.getUploadPath(), relativePath);
            Files.createDirectories(dirPath);

            Path targetPath = dirPath.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String sha256 = FileUtil.sha256(targetPath);
            String filePath = relativePath + "/" + storedName;

            FileRecord record = FileRecord.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .filePath(filePath)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .checksumSha256(sha256)
                    .storageType("LOCAL")
                    .uploadedBy(uploadedBy)
                    .build();
            fileRecordMapper.insert(record);

            log.info("File uploaded: {} -> {} (size={})", originalName, filePath, FileUtil.formatFileSize(file.getSize()));
            return record;

        } catch (IOException | NoSuchAlgorithmException e) {
            log.error("File upload failed", e);
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public Path getFilePath(String relativePath) {
        Path path = Paths.get(storageConfig.getUploadPath(), relativePath);
        if (!Files.exists(path)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return path;
    }

    public void deleteFile(Long fileId) {
        FileRecord record = fileRecordMapper.selectById(fileId);
        if (record == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }

        try {
            Path path = Paths.get(storageConfig.getUploadPath(), record.getFilePath());
            Files.deleteIfExists(path);
            fileRecordMapper.deleteById(fileId);
            log.info("File deleted: {}", record.getFilePath());
        } catch (IOException e) {
            log.error("File deletion failed: {}", record.getFilePath(), e);
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "文件删除失败");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "文件不能为空");
        }
        if (file.getSize() > storageConfig.getMaxFileSize()) {
            throw new BusinessException(ErrorCode.FILE_TOO_LARGE);
        }
        String ext = FileUtil.getExtension(file.getOriginalFilename());
        if (!storageConfig.getAllowedExtensions().contains(ext) && !isImageExtension(ext)) {
            throw new BusinessException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }
    }

    private boolean isImageExtension(String ext) {
        return IMAGE_EXTENSIONS.contains(ext.toLowerCase());
    }

    private static final java.util.Set<String> IMAGE_EXTENSIONS =
            java.util.Set.of("jpg", "jpeg", "png", "gif", "webp", "svg", "ico");
}
