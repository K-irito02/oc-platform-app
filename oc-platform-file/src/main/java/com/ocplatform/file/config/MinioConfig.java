package com.ocplatform.file.config;

import io.minio.MinioClient;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "minio")
public class MinioConfig {
    private String endpoint = "http://localhost:9000";
    private String accessKey = "minioadmin";
    private String secretKey;
    private String bucketAvatars = "avatars";
    private String bucketProducts = "products";
    private String bucketVideos = "videos";
    private String bucketDownloads = "downloads";
    private String externalUrl = "/minio";

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
