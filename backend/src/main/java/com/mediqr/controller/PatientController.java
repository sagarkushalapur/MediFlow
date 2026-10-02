package com.mediqr.controller;

import com.mediqr.dto.*;
import com.mediqr.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/patient")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getProfile(Principal principal) {
        PatientProfileResponse profile = patientService.getProfile(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Patient profile fetched successfully", profile));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getMedicalHistory(Principal principal) {
        List<MedicalRecordResponse> history = patientService.getMedicalHistory(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Medical history fetched successfully", history));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPrescriptions(Principal principal) {
        List<PrescriptionResponse> prescriptions = patientService.getPrescriptions(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Prescriptions fetched successfully", prescriptions));
    }

    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getMedicines(Principal principal) {
        List<MedicineResponse> medicines = patientService.getMedicines(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Medicines fetched successfully", medicines));
    }

    @GetMapping("/qr")
    public ResponseEntity<ApiResponse<QrResponse>> getQr(Principal principal) {
        QrResponse qr = patientService.getQrCode(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("QR code generated successfully", qr));
    }
}
