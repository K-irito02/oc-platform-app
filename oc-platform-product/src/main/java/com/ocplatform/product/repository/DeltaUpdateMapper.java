package com.ocplatform.product.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.product.entity.DeltaUpdate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Optional;

@Mapper
public interface DeltaUpdateMapper extends BaseMapper<DeltaUpdate> {

    @Select("SELECT * FROM delta_updates WHERE from_version_id = #{fromId} AND to_version_id = #{toId} AND platform = #{platform} AND architecture = #{arch}")
    Optional<DeltaUpdate> findDelta(@Param("fromId") Long fromId, @Param("toId") Long toId, @Param("platform") String platform, @Param("arch") String arch);
}
