package com.it4409.multicam.dto;

public record ApiResponse<T>(String code, String message, T data) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("1000", "OK", data);
    }
}
