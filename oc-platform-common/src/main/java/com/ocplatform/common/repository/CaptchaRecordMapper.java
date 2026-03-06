package com.ocplatform.common.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.common.entity.CaptchaRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CaptchaRecordMapper extends BaseMapper<CaptchaRecord> {
}
