package com.mediqr.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class ConsultationRequest {

    private Long patientId;
    private String qrToken;

    @NotBlank(message = "Diagnosis is required")
    private String diagnosis;

    private String symptoms;
    private String notes;

    private List<MedicineItemRequest> medicines = new ArrayList<>();

    public ConsultationRequest() {
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<MedicineItemRequest> getMedicines() {
        return medicines;
    }

    public void setMedicines(List<MedicineItemRequest> medicines) {
        this.medicines = medicines;
    }
}
