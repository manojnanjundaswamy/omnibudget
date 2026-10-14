package com.omnibudget.dto;

import com.omnibudget.domain.CapturedItem;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaptureViewDto {
    private String address;
    private boolean emailReady;
    private ConfirmationDto confirmation;
    private long pending;
    private List<CapturedItem> items;
    private Instant lastEmailAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmationDto {
        private String code;
        private String link;
        private Instant receivedAt;
    }
}
