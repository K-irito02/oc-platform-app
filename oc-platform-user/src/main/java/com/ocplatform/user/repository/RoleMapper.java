package com.ocplatform.user.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.user.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Optional;

@Mapper
public interface RoleMapper extends BaseMapper<Role> {

    @Select("SELECT * FROM roles WHERE code = #{code}")
    Optional<Role> findByCode(@Param("code") String code);

    @Select("SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = #{userId}")
    List<Role> findRolesByUserId(@Param("userId") Long userId);
}
