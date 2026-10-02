package com.mediqr.controller;

import com.mediqr.dto.ApiResponse;
import com.mediqr.dto.PatientProfileResponse;
import com.mediqr.service.DoctorService;
import com.mediqr.service.QrService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qr")
@CrossOrigin(origins = "*")
public class QrController {

    private final QrService qrService;
    private final DoctorService doctorService;

    public QrController(QrService qrService, DoctorService doctorService) {
        this.qrService = qrService;
        this.doctorService = doctorService;
    }

    /**
     * Resolves a QR token to check validity and provides redirect info for the doctor portal.
     */
    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveToken(@PathVariable("token") String token) {
        PatientProfileResponse patient = doctorService.getPatientByQrToken(token);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("valid", true);
        responseData.put("token", token);
        responseData.put("patientId", patient.getId());
        responseData.put("patientName", patient.getName());
        responseData.put("bloodGroup", patient.getBloodGroup());
        responseData.put("accessUrl", qrService.buildAccessUrl(token));

        return ResponseEntity.ok(ApiResponse.success("Valid MediQR token", responseData));
    }

    /**
     * Streams the generated QR code directly as a PNG image.
     */
    @GetMapping(value = "/image/{token}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrImage(@PathVariable("token") String token) {
        String accessUrl = qrService.buildAccessUrl(token);
        byte[] imageBytes = qrService.generateQrCodeImageBytes(accessUrl, 300, 300);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(imageBytes.length);

        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
    }
}
