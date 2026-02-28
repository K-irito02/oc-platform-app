package com.qtplatform.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> records;
    private long total;
    private int page;
    private int size;
    private int totalPages;
    private Long totalWithReplies;

    public static <T> PageResponse<T> of(List<T> records, long total, int page, int size) {
        return PageResponse.<T>builder()
                .records(records)
                .total(total)
                .page(page)
                .size(size)
                .totalPages((int) Math.ceil((double) total / size))
                .build();
    }
}
