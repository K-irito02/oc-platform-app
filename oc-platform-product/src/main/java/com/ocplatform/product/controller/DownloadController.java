package com.ocplatform.product.controller;

import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.util.IpUtil;
import com.ocplatform.product.entity.ProductVersion;
import com.ocplatform.product.repository.ProductMapper;
import com.ocplatform.product.repository.ProductVersionMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequestMapping("/api/v1/downloads")
@RequiredArgsConstructor
public class DownloadController {

    private final ProductVersionMapper versionMapper;
    private final ProductMapper productMapper;

    @Value("${storage.upload-path:./uploads}")
    private String uploadPath;

    @GetMapping("/{productId}/{versionId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long productId,
            @PathVariable Long versionId,
            @RequestHeader(value = "Range", required = false) String rangeHeader,
            Authentication authentication,
            HttpServletRequest request) {

        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null || !version.getProductId().equals(productId)) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }

        Path filePath = Paths.get(uploadPath, version.getFilePath());
        if (!Files.exists(filePath)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }

        long fileSize = version.getFileSize();

        // Increment counters
        versionMapper.incrementDownloadCount(versionId);
        productMapper.incrementDownloadCount(productId, 1);

        String contentDisposition = "attachment; filename=\"" + version.getFileName() + "\"";

        // No Range header: full download
        if (rangeHeader == null || rangeHeader.isEmpty()) {
            Resource resource = new FileSystemResource(filePath);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(fileSize)
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header("X-Checksum-SHA256", version.getChecksumSha256())
                    .body(resource);
        }

        // Range header present: partial content (resume)
        long[] range = parseRange(rangeHeader, fileSize);
        long start = range[0];
        long end = range[1];
        long contentLength = end - start + 1;

        try {
            RandomAccessFile raf = new RandomAccessFile(filePath.toFile(), "r");
            raf.seek(start);
            byte[] buffer = new byte[(int) Math.min(contentLength, 8 * 1024 * 1024)]; // 8MB max chunk
            int bytesRead = raf.read(buffer, 0, (int) Math.min(buffer.length, contentLength));
            raf.close();

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(contentLength)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .body(new FileSystemResource(filePath));

        } catch (IOException e) {
            log.error("Download failed for version {}", versionId, e);
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND, "文件读取失败");
        }
    }

    @GetMapping("/{productId}/latest")
    public ResponseEntity<Resource> downloadLatest(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "WINDOWS") String platform,
            @RequestParam(defaultValue = "x64") String arch,
            @RequestHeader(value = "Range", required = false) String rangeHeader,
            Authentication authentication,
            HttpServletRequest request) {

        ProductVersion version = versionMapper.findLatestPublishedWithArch(productId, platform, arch)
                .orElseThrow(() -> new BusinessException(ErrorCode.VERSION_NOT_FOUND));

        // Delegate to the main download method
        return downloadFile(productId, version.getId(), rangeHeader, authentication, request);
    }

    @RequestMapping(value = "/{productId}/{versionId}", method = RequestMethod.HEAD)
    public ResponseEntity<Void> getFileInfo(@PathVariable Long productId,
                                            @PathVariable Long versionId) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null || !version.getProductId().equals(productId)) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(version.getFileSize())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header("X-Checksum-SHA256", version.getChecksumSha256())
                .header("X-File-Name", version.getFileName())
                .build();
    }

    private long[] parseRange(String rangeHeader, long fileSize) {
        // Format: bytes=start-end or bytes=start-
        String range = rangeHeader.replace("bytes=", "").trim();
        String[] parts = range.split("-");
        long start = Long.parseLong(parts[0]);
        long end = parts.length > 1 && !parts[1].isEmpty()
                ? Long.parseLong(parts[1])
                : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的 Range 请求");
        }
        return new long[]{start, end};
    }
}
