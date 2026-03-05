package com.ocplatform.product.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformConfigVO {
    @JsonProperty("platforms")
    private List<PlatformOption> platforms;
    
    @JsonProperty("architectures")
    private List<ArchitectureOption> architectures;
    
    @JsonProperty("allowCustomPlatform")
    private Boolean allowCustomPlatform;
    
    @JsonProperty("allowCustomArchitecture")
    private Boolean allowCustomArchitecture;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformOption {
        @JsonProperty("value")
        private String value;
        
        @JsonProperty("label")
        private String label;
        
        @JsonProperty("labelEn")
        private String labelEn;
        
        @JsonProperty("icon")
        private String icon;
        
        @JsonProperty("architectures")
        private List<String> architectures;
        
        @JsonProperty("enabled")
        private Boolean enabled;
        
        @JsonProperty("sortOrder")
        private Integer sortOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArchitectureOption {
        @JsonProperty("value")
        private String value;
        
        @JsonProperty("label")
        private String label;
        
        @JsonProperty("labelEn")
        private String labelEn;
    }
}
