package com.omnibudget.dto;

import com.omnibudget.domain.AccountType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAccountRequest {
    private String name;
    private AccountType type;
    private BigDecimal balance;
    private String currency;
    private String institutionName;
    private String accountNumberLast4;
    private BigDecimal creditLimit;
    private BigDecimal apr;
    private Integer statementClosingDay;
    private Integer paymentDueDay;
    private String color;
    private String icon;
}
