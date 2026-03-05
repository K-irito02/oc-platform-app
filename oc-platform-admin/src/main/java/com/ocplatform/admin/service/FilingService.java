package com.ocplatform.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ocplatform.common.entity.SystemConfig;
import com.ocplatform.common.exception.BusinessException;
import com.ocplatform.common.repository.SystemConfigMapper;
import com.ocplatform.common.response.ErrorCode;
import com.ocplatform.user.entity.User;
import com.ocplatform.user.repository.EmailVerificationMapper;
import com.ocplatform.user.repository.RoleMapper;
import com.ocplatform.user.repository.UserMapper;
import com.ocplatform.user.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FilingService {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final EmailService emailService;
    private final SystemConfigMapper systemConfigMapper;
    private final EmailVerificationMapper emailVerificationMapper;

    private static final String CONFIG_ICP = "footer.icp";
    private static final String CONFIG_POLICE_BEIAN = "footer.beian";
    private static final String CONFIG_POLICE_ICON_URL = "footer.police_icon_url";

    public String getSuperAdminEmail() {
        var superAdminRole = roleMapper.findByCode("SUPER_ADMIN")
                .orElseThrow(() -> new BusinessException(ErrorCode.UNKNOWN_ERROR, "超级管理员角色不存在"));
        
        List<User> superAdmins = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                        .eq(User::getStatus, "ACTIVE")
                        .exists("SELECT 1 FROM user_roles ur WHERE ur.user_id = users.id AND ur.role_id = " + superAdminRole.getId())
        );
        
        if (superAdmins.isEmpty()) {
            throw new BusinessException(ErrorCode.UNKNOWN_ERROR, "未找到超级管理员账号");
        }
        
        return superAdmins.get(0).getEmail();
    }

    public void sendFilingVerificationCode() {
        String email = getSuperAdminEmail();
        emailService.generateAndSendCode(email, "FILING_VERIFY");
        log.info("备案修改验证码已发送至超级管理员邮箱: {}", email.replaceAll("(?<=.{2}).(?=.*@)", "*"));
    }

    public boolean verifyCode(String code) {
        String email = getSuperAdminEmail();
        return emailService.verifyCode(email, code, "FILING_VERIFY");
    }

    @Transactional
    public void updateFilingConfig(String icp, String policeBeian, String policeIconUrl, Long userId) {
        updateOrCreateConfig(CONFIG_ICP, icp, "ICP备案号", userId);
        updateOrCreateConfig(CONFIG_POLICE_BEIAN, policeBeian, "公安备案号", userId);
        updateOrCreateConfig(CONFIG_POLICE_ICON_URL, policeIconUrl != null ? policeIconUrl : "", "公安备案图标URL", userId);
        log.info("备案配置已更新, 操作人: {}", userId);
    }

    private void updateOrCreateConfig(String key, String value, String description, Long userId) {
        systemConfigMapper.findByKey(key).ifPresentOrElse(
            config -> {
                config.setConfigValue(value != null ? value : "");
                config.setUpdatedBy(userId);
                systemConfigMapper.updateById(config);
            },
            () -> {
                SystemConfig newConfig = new SystemConfig();
                newConfig.setConfigKey(key);
                newConfig.setConfigValue(value != null ? value : "");
                newConfig.setDescription(description);
                newConfig.setUpdatedBy(userId);
                systemConfigMapper.insert(newConfig);
            }
        );
    }
}
