package com.ocplatform.user.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.user.entity.EmailVerification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Optional;

@Mapper
public interface EmailVerificationMapper extends BaseMapper<EmailVerification> {

    @Select("SELECT * FROM email_verifications WHERE email = #{email} AND type = #{type} AND is_used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1")
    Optional<EmailVerification> findLatestValid(@Param("email") String email, @Param("type") String type);

    @Select("SELECT COUNT(*) FROM email_verifications WHERE email = #{email} AND type = #{type} AND created_at > NOW() - INTERVAL '1 hour'")
    int countRecentByEmail(@Param("email") String email, @Param("type") String type);
}
