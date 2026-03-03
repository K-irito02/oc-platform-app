package com.ocplatform.common.constant;

public final class RedisKeys {

    private RedisKeys() {}

    // Auth
    public static final String AUTH_SESSION = "qt:auth:session:";
    public static final String AUTH_BLACKLIST = "qt:auth:blacklist:";

    // User
    public static final String USER_INFO = "qt:user:info:";

    // Product
    public static final String PRODUCT_DETAIL = "qt:product:detail:";
    public static final String PRODUCT_LIST = "qt:product:list:";
    public static final String PRODUCT_FEATURED = "qt:product:featured";

    // Version
    public static final String VERSION_LATEST = "qt:version:latest:";

    // Stats
    public static final String STATS_DOWNLOAD = "qt:stats:download:";
    public static final String STATS_VIEW = "qt:stats:view:";

    // Rate limiting
    public static final String LIMIT_LOGIN = "qt:limit:login:";
    public static final String LIMIT_REGISTER = "qt:limit:register:";
    public static final String LIMIT_API = "qt:limit:api:";

    // Verification
    public static final String VERIFY_CODE = "qt:verify:code:";
}
