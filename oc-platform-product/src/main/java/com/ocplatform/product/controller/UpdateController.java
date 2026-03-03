package com.ocplatform.product.controller;

import com.ocplatform.common.response.ApiResponse;
import com.ocplatform.common.util.SemanticVersion;
import com.ocplatform.product.dto.ProductVersionVO;
import com.ocplatform.product.service.VersionService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/updates")
@RequiredArgsConstructor
public class UpdateController {

    private final VersionService versionService;

    @Value("${server.port:8081}")
    private int serverPort;

    @GetMapping("/check")
    public ApiResponse<UpdateCheckResponse> checkUpdate(
            @RequestParam Long product,
            @RequestParam String version,
            @RequestParam String platform,
            @RequestParam(defaultValue = "x64") String arch) {

        ProductVersionVO latest = versionService.getLatestPublishedVersion(product, platform.toUpperCase(), arch);

        if (latest == null || !SemanticVersion.isNewer(latest.getVersionNumber(), version)) {
            return ApiResponse.success(UpdateCheckResponse.builder().hasUpdate(false).build());
        }

        // Grayscale check
        if (latest.getRolloutPercentage() != null && latest.getRolloutPercentage() < 100) {
            int hash = Math.abs((product + platform + arch).hashCode() % 100);
            if (hash >= latest.getRolloutPercentage()) {
                return ApiResponse.success(UpdateCheckResponse.builder().hasUpdate(false).build());
            }
        }

        String downloadUrl = String.format("/api/v1/downloads/%d/%d", product, latest.getId());

        UpdateCheckResponse response = UpdateCheckResponse.builder()
                .hasUpdate(true)
                .updateType(Boolean.TRUE.equals(latest.getIsMandatory()) ? "MANDATORY" : "OPTIONAL")
                .version(latest.getVersionNumber())
                .versionCode(latest.getVersionCode())
                .releaseNotes(latest.getReleaseNotes())
                .releaseNotesEn(latest.getReleaseNotesEn())
                .fullUpdate(FullUpdateInfo.builder()
                        .downloadUrl(downloadUrl)
                        .fileSize(latest.getFileSize())
                        .checksumSha256(latest.getChecksumSha256())
                        .build())
                .forceUpdate(Boolean.TRUE.equals(latest.getIsMandatory()))
                .build();

        return ApiResponse.success(response);
    }

    @PostMapping("/report")
    public ApiResponse<Void> reportUpdate(@RequestBody UpdateReportRequest request) {
        // Log update result - can be expanded later
        return ApiResponse.success();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateCheckResponse {
        private Boolean hasUpdate;
        private String updateType;
        private String version;
        private Integer versionCode;
        private String releaseNotes;
        private String releaseNotesEn;
        private FullUpdateInfo fullUpdate;
        private FullUpdateInfo deltaUpdate;
        private Boolean forceUpdate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FullUpdateInfo {
        private String downloadUrl;
        private Long fileSize;
        private String checksumSha256;
        private String fromVersion;
    }

    @Data
    public static class UpdateReportRequest {
        private Long productId;
        private String fromVersion;
        private String toVersion;
        private String platform;
        private String status; // SUCCESS, FAILED
        private String errorMessage;
    }
}
