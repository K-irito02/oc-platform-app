package com.ocplatform.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaVerifyResponse {

    private Boolean success;
    private String challengeTs;
    private String hostname;
    private String message;
    private java.util.List<String> errorCodes;
}
