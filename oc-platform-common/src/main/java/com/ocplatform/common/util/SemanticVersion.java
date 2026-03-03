package com.ocplatform.common.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SemanticVersion {

    private SemanticVersion() {}

    private static final Pattern VERSION_PATTERN =
            Pattern.compile("^(\\d+)\\.(\\d+)\\.(\\d+)(?:-(alpha|beta|rc)(?:\\.(\\d+))?)?$",
                    Pattern.CASE_INSENSITIVE);

    public static boolean isValid(String version) {
        return version != null && VERSION_PATTERN.matcher(version).matches();
    }

    public static boolean isNewer(String candidate, String current) {
        int cmp = compare(candidate, current);
        return cmp > 0;
    }

    public static int compare(String v1, String v2) {
        int[] parts1 = parse(v1);
        int[] parts2 = parse(v2);

        for (int i = 0; i < 3; i++) {
            if (parts1[i] != parts2[i]) {
                return Integer.compare(parts1[i], parts2[i]);
            }
        }
        // Compare pre-release: 0=release (highest), 1=alpha, 2=beta, 3=rc
        // A release (preRelease=0) is newer than any pre-release
        if (parts1[3] != parts2[3]) {
            if (parts1[3] == 0) return 1;
            if (parts2[3] == 0) return -1;
            return Integer.compare(parts1[3], parts2[3]);
        }
        return Integer.compare(parts1[4], parts2[4]);
    }

    public static int toVersionCode(String version) {
        int[] parts = parse(version);
        return parts[0] * 10000 + parts[1] * 100 + parts[2];
    }

    private static int[] parse(String version) {
        if (version == null) return new int[]{0, 0, 0, 0, 0};
        Matcher m = VERSION_PATTERN.matcher(version.trim());
        if (!m.matches()) return new int[]{0, 0, 0, 0, 0};

        int major = Integer.parseInt(m.group(1));
        int minor = Integer.parseInt(m.group(2));
        int patch = Integer.parseInt(m.group(3));
        int preRelease = 0; // 0 = release
        int preNum = 0;

        if (m.group(4) != null) {
            switch (m.group(4).toLowerCase()) {
                case "alpha" -> preRelease = 1;
                case "beta" -> preRelease = 2;
                case "rc" -> preRelease = 3;
            }
            if (m.group(5) != null) {
                preNum = Integer.parseInt(m.group(5));
            }
        }

        return new int[]{major, minor, patch, preRelease, preNum};
    }
}
