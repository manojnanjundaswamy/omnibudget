package com.omnibudget.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateGoalRequest {
    private String userId;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private String category;
    private LocalDate targetDate;
    private String color;
    private String icon;
}
