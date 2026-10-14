package com.omnibudget.dto;

import com.omnibudget.domain.CapturedItem;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasteCaptureResponse {
    private int added;
    private int duplicates;
    private int unreadable;
    private List<CapturedItem> items;
}
