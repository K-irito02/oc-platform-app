package com.ocplatform.common.util;

import jakarta.servlet.http.HttpServletRequest;

public final class IpUtil {

    private IpUtil() {}

    public static String getClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_CLIENT_IP",
                "HTTP_X_FORWARDED_FOR"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For may contain multiple IPs, take the first one
                int idx = ip.indexOf(',');
                return idx > 0 ? ip.substring(0, idx).trim() : ip.trim();
            }
        }
        return request.getRemoteAddr();
    }

    public static String mask(String ip) {
        if (ip == null) return null;
        if (ip.contains(":")) {
            // IPv6 - mask last 4 groups
            String[] parts = ip.split(":");
            if (parts.length > 4) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < parts.length; i++) {
                    if (i > 0) sb.append(":");
                    sb.append(i < parts.length - 4 ? parts[i] : "****");
                }
                return sb.toString();
            }
        }
        // IPv4 - mask last two octets
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".***.**";
        }
        return ip;
    }
}
