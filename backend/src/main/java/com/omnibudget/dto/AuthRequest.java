package com.omnibudget.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
    private String name;
    private Boolean isRegister = false;
}
