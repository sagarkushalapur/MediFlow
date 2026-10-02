package com.mediqr.controller;

import com.mediqr.dto.*;
import com.mediqr.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/doctor")
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/patient/{id}")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getPatientById(@PathVariable("id") Long id) {
        PatientProfileResponse patient = doctorService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success("Patient details fetched successfully", patient));
    }

    @GetMapping("/patient-by-token/{token}")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getPatientByToken(@PathVariable("token") String token) {
        PatientProfileResponse patient = doctorService.getPatientByQrToken(token);
        return ResponseEntity.ok(ApiResponse.success("Patient identified via QR token", patient));
    }

    @GetMapping("/patient/{id}/history")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getPatientHistory(@PathVariable("id") Long id) {
        List<MedicalRecordResponse> history = doctorService.getPatientHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Patient medical history retrieved", history));
    }

    /**
     * Creates a new consultation record.
     * Guaranteed: Old records are NEVER overwritten or deleted.
     */
    @PostMapping("/consultation")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> addConsultation(
            Principal principal,
            @Valid @RequestBody ConsultationRequest request) {
        MedicalRecordResponse record = doctorService.addConsultation(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("New consultation recorded permanently", record));
    }
}
