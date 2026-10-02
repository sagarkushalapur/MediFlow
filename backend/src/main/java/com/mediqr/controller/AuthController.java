package com.mediqr.controller;

import com.mediqr.dto.*;
import com.mediqr.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/patient/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerPatient(@Valid @RequestBody PatientRegisterRequest request) {
        AuthResponse response = authService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Patient registered successfully", response));
    }

    @PostMapping("/doctor/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerDoctor(@Valid @RequestBody DoctorRegisterRequest request) {
        AuthResponse response = authService.registerDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
