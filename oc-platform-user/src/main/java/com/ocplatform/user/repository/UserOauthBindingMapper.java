package com.ocplatform.user.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.user.entity.UserOauthBinding;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserOauthBindingMapper extends BaseMapper<UserOauthBinding> {

    @Select("SELECT * FROM user_oauth_bindings WHERE oauth_provider = #{provider} AND oauth_id = #{oauthId}")
    Optional<UserOauthBinding> findByProviderAndOauthId(@Param("provider") String provider, @Param("oauthId") String oauthId);

    @Select("SELECT * FROM user_oauth_bindings WHERE user_id = #{userId}")
    List<UserOauthBinding> findByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM user_oauth_bindings WHERE user_id = #{userId} AND oauth_provider = #{provider}")
    Optional<UserOauthBinding> findByUserIdAndProvider(@Param("userId") Long userId, @Param("provider") String provider);
}
