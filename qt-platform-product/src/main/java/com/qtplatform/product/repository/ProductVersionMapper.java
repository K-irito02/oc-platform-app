package com.qtplatform.product.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qtplatform.product.entity.ProductVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProductVersionMapper extends BaseMapper<ProductVersion> {

    @Select("SELECT * FROM product_versions WHERE product_id = #{productId} AND platform = #{platform} AND is_latest = true AND status = 'PUBLISHED' LIMIT 1")
    Optional<ProductVersion> findLatestPublished(@Param("productId") Long productId, @Param("platform") String platform);

    @Select("SELECT * FROM product_versions WHERE product_id = #{productId} AND platform = #{platform} AND architecture = #{arch} AND is_latest = true AND status = 'PUBLISHED' LIMIT 1")
    Optional<ProductVersion> findLatestPublishedWithArch(@Param("productId") Long productId, @Param("platform") String platform, @Param("arch") String arch);

    @Select("SELECT * FROM product_versions WHERE product_id = #{productId} AND status = 'PUBLISHED' ORDER BY version_code DESC")
    List<ProductVersion> findPublishedByProduct(@Param("productId") Long productId);

    @Update("UPDATE product_versions SET is_latest = false WHERE product_id = #{productId} AND platform = #{platform} AND architecture = #{arch}")
    void clearLatestFlag(@Param("productId") Long productId, @Param("platform") String platform, @Param("arch") String arch);

    @Update("UPDATE product_versions SET download_count = download_count + 1 WHERE id = #{versionId}")
    void incrementDownloadCount(@Param("versionId") Long versionId);

    @Select("SELECT EXISTS(SELECT 1 FROM product_versions WHERE product_id = #{productId} AND version_number = #{versionNumber} AND platform = #{platform} AND architecture = #{arch})")
    boolean existsByProductAndVersionAndPlatform(@Param("productId") Long productId, @Param("versionNumber") String versionNumber, @Param("platform") String platform, @Param("arch") String arch);

    @Select("SELECT COALESCE(SUM(download_count), 0) FROM product_versions")
    Long getTotalDownloadCount();
}
