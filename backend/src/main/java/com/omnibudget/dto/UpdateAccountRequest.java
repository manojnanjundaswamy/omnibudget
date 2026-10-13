package com.omnibudget.dto;

import com.omnibudget.domain.AccountType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateAccountRequest {
    private String name;
    private AccountType type;
    private BigDecimal balance;
    private String currency;
    private String institutionName;
    private BigDecimal creditLimit;
    private String color;
    private String icon;
}
