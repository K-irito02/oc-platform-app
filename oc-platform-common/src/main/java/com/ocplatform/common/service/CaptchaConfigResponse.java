package com.ocplatform.common.service;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CaptchaConfigResponse {

    private Boolean enabled;
    private String siteKey;
}
