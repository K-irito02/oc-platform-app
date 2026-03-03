package com.ocplatform.user.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.user.entity.User;
import org.apache.ibatis.annotations.*;

import java.util.Optional;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT * FROM users WHERE email = #{email}")
    Optional<User> findByEmail(@Param("email") String email);

    @Select("SELECT * FROM users WHERE username = #{username}")
    Optional<User> findByUsername(@Param("username") String username);

    @Select("SELECT EXISTS(SELECT 1 FROM users WHERE email = #{email})")
    boolean existsByEmail(@Param("email") String email);

    @Select("SELECT EXISTS(SELECT 1 FROM users WHERE username = #{username})")
    boolean existsByUsername(@Param("username") String username);

    @Update("UPDATE users SET last_login_at = NOW(), last_login_ip = #{ip} WHERE id = #{id}")
    void updateLoginInfo(@Param("id") Long id, @Param("ip") String ip);

    @Update("UPDATE users SET email = #{email}, updated_at = NOW() WHERE id = #{id}")
    void updateEmail(@Param("id") Long id, @Param("email") String email);

    @Update("UPDATE users SET password_hash = #{passwordHash}, updated_at = NOW() WHERE id = #{id}")
    void updatePassword(@Param("id") Long id, @Param("passwordHash") String passwordHash);
}
