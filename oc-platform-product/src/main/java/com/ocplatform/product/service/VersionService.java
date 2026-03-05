package com.ocplatform.product.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.common.util.SemanticVersion;
import com.ocplatform.product.dto.CreateVersionRequest;
import com.ocplatform.product.dto.ProductVersionVO;
import com.ocplatform.product.entity.Product;
import com.ocplatform.product.entity.ProductVersion;
import com.ocplatform.product.repository.ProductMapper;
import com.ocplatform.product.repository.ProductVersionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VersionService {

    private final ProductVersionMapper versionMapper;
    private final ProductMapper productMapper;

    public List<ProductVersionVO> getVersionsByProduct(Long productId) {
        LambdaQueryWrapper<ProductVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductVersion::getProductId, productId)
                .eq(ProductVersion::getStatus, "PUBLISHED")
                .eq(ProductVersion::getShowOnDetail, true)
                .orderByDesc(ProductVersion::getVersionCode);
        return versionMapper.selectList(wrapper).stream()
                .map(this::toVO).collect(Collectors.toList());
    }

    public List<ProductVersionVO> getAllVersionsByProduct(Long productId) {
        LambdaQueryWrapper<ProductVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductVersion::getProductId, productId)
                .orderByDesc(ProductVersion::getVersionCode);
        return versionMapper.selectList(wrapper).stream()
                .map(this::toVO).collect(Collectors.toList());
    }

    @Transactional
    public void deleteVersion(Long versionId) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }
        versionMapper.deleteById(versionId);
        log.info("Version {} deleted", versionId);
    }

    public ProductVersionVO getLatestVersion(Long productId) {
        LambdaQueryWrapper<ProductVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductVersion::getProductId, productId)
                .eq(ProductVersion::getIsLatest, true)
                .eq(ProductVersion::getStatus, "PUBLISHED")
                .last("LIMIT 1");
        ProductVersion version = versionMapper.selectOne(wrapper);
        if (version == null) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }
        return toVO(version);
    }

    public ProductVersionVO getLatestPublishedVersion(Long productId, String platform, String arch) {
        return versionMapper.findLatestPublishedWithArch(productId, platform, arch)
                .map(this::toVO)
                .orElse(null);
    }

    public ProductVersionVO getVersionById(Long versionId) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            return null;
        }
        return toVO(version);
    }

    @Transactional
    public ProductVersionVO createVersion(Long productId, CreateVersionRequest request) {
        if (!SemanticVersion.isValid(request.getVersionNumber())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "版本号格式不正确，应为语义化版本号 (如 1.2.3)");
        }

        String arch = request.getArchitecture() != null ? request.getArchitecture() : "x64";
        if (versionMapper.existsByProductAndVersionAndPlatform(
                productId, request.getVersionNumber(), request.getPlatform(), arch)) {
            throw new BusinessException(ErrorCode.VERSION_EXISTS);
        }

        // Clear previous latest flag
        versionMapper.clearLatestFlag(productId, request.getPlatform(), arch);

        ProductVersion version = ProductVersion.builder()
                .productId(productId)
                .versionNumber(request.getVersionNumber())
                .versionCode(SemanticVersion.toVersionCode(request.getVersionNumber()))
                .versionType(request.getVersionType() != null ? request.getVersionType() : "RELEASE")
                .platform(request.getPlatform())
                .architecture(arch)
                .minOsVersion(request.getMinOsVersion())
                .fileName(request.getFileName())
                .fileSize(request.getFileSize())
                .filePath(request.getFilePath())
                .checksumSha256(request.getChecksumSha256())
                .checksumMd5(request.getChecksumMd5())
                .signature(request.getSignature())
                .fileRecordId(request.getFileRecordId())
                .downloadCount(0L)
                .isMandatory(request.getIsMandatory() != null ? request.getIsMandatory() : false)
                .isLatest(true)
                .showOnDetail(request.getShowOnDetail() != null ? request.getShowOnDetail() : true)
                .status(request.getStatus() != null ? request.getStatus() : "DRAFT")
                .rolloutPercentage(request.getRolloutPercentage() != null ? request.getRolloutPercentage() : 100)
                .releaseNotes(request.getReleaseNotes())
                .releaseNotesEn(request.getReleaseNotesEn())
                .build();
        versionMapper.insert(version);

        // 如果创建的版本状态是 PUBLISHED，更新产品的 latestVersion 字段
        if ("PUBLISHED".equals(version.getStatus())) {
            updateProductLatestVersion(version.getProductId(), version.getVersionNumber());
        }

        log.info("Version {} created for product {}", request.getVersionNumber(), productId);
        return toVO(version);
    }

    @Transactional
    public void publishVersion(Long versionId) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }
        version.setStatus("PUBLISHED");
        version.setPublishedAt(OffsetDateTime.now());
        versionMapper.updateById(version);

        // 更新产品的 latestVersion 字段
        updateProductLatestVersion(version.getProductId(), version.getVersionNumber());

        log.info("Version {} published", versionId);
    }

    @Transactional
    public void rollbackVersion(Long productId, Long versionId) {
        ProductVersion targetVersion = versionMapper.selectById(versionId);
        if (targetVersion == null || !targetVersion.getProductId().equals(productId)) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }

        // Clear all latest flags for this platform+arch
        versionMapper.clearLatestFlag(productId, targetVersion.getPlatform(), targetVersion.getArchitecture());

        // Set rollback target as latest
        targetVersion.setIsLatest(true);
        targetVersion.setStatus("PUBLISHED");
        versionMapper.updateById(targetVersion);

        log.info("Version rollback: product={}, target version={}", productId, targetVersion.getVersionNumber());
    }

    public void auditVersion(Long versionId, String status) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }
        version.setStatus(status);
        if ("PUBLISHED".equals(status)) {
            version.setPublishedAt(OffsetDateTime.now());
        }
        versionMapper.updateById(version);
    }

    public void updateShowOnDetail(Long versionId, Boolean showOnDetail) {
        ProductVersion version = versionMapper.selectById(versionId);
        if (version == null) {
            throw new BusinessException(ErrorCode.VERSION_NOT_FOUND);
        }
        version.setShowOnDetail(showOnDetail);
        versionMapper.updateById(version);
        log.info("Version {} showOnDetail updated to {}", versionId, showOnDetail);
    }

    public void incrementDownloadCount(Long versionId) {
        versionMapper.incrementDownloadCount(versionId);
    }

    private ProductVersionVO toVO(ProductVersion v) {
        return ProductVersionVO.builder()
                .id(v.getId())
                .productId(v.getProductId())
                .versionNumber(v.getVersionNumber())
                .versionCode(v.getVersionCode())
                .versionType(v.getVersionType())
                .platform(v.getPlatform())
                .architecture(v.getArchitecture())
                .minOsVersion(v.getMinOsVersion())
                .fileName(v.getFileName())
                .fileSize(v.getFileSize())
                .checksumSha256(v.getChecksumSha256())
                .fileRecordId(v.getFileRecordId())
                .downloadCount(v.getDownloadCount())
                .isMandatory(v.getIsMandatory())
                .isLatest(v.getIsLatest())
                .showOnDetail(v.getShowOnDetail())
                .releaseNotes(v.getReleaseNotes())
                .releaseNotesEn(v.getReleaseNotesEn())
                .status(v.getStatus())
                .rolloutPercentage(v.getRolloutPercentage())
                .createdAt(v.getCreatedAt())
                .publishedAt(v.getPublishedAt())
                .build();
    }

    /**
     * 更新产品的 latestVersion 字段
     */
    private void updateProductLatestVersion(Long productId, String versionNumber) {
        Product product = productMapper.selectById(productId);
        if (product != null) {
            product.setLatestVersion(versionNumber);
            productMapper.updateById(product);
            log.info("Product {} latestVersion updated to {}", productId, versionNumber);
        }
    }
}
