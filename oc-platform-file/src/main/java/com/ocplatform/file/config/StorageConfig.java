package com.ocplatform.file.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "storage")
public class StorageConfig {

    private String uploadPath = "./uploads";
    private long maxFileSize = 1073741824L; // 1GB
    private List<String> allowedExtensions = List.of(
            "exe", "zip", "7z", "tar.gz", "dmg", "AppImage", "msi", "deb", "rpm"
    );
}
