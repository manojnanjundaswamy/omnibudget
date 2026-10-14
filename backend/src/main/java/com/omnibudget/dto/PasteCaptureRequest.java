package com.omnibudget.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasteCaptureRequest {
    private String text;
    private String source; // "PASTE" or "SHARE"
}
