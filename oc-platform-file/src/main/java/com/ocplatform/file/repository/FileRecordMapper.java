package com.ocplatform.file.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ocplatform.file.entity.FileRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Optional;

@Mapper
public interface FileRecordMapper extends BaseMapper<FileRecord> {

    @Select("SELECT * FROM file_records WHERE file_path = #{filePath}")
    Optional<FileRecord> findByFilePath(@Param("filePath") String filePath);
}
