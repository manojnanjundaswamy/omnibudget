package com.omnibudget.dto;

import lombok.Data;

@Data
public class CreateAdminUserRequest {
    private String email;
    private String name;
    private String role; // USER, ADMIN
    private String plan; // STARTER, PRO, HOUSEHOLD
    private String currency;
}
