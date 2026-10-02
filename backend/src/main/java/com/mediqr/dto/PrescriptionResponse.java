package com.mediqr.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionResponse {

    private Long id;
    private Long medicalRecordId;
    private LocalDate prescriptionDate;
    private List<MedicineResponse> medicines = new ArrayList<>();

    public PrescriptionResponse() {
    }

    public PrescriptionResponse(Long id, Long medicalRecordId, LocalDate prescriptionDate, List<MedicineResponse> medicines) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.prescriptionDate = prescriptionDate;
        this.medicines = medicines;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMedicalRecordId() {
        return medicalRecordId;
    }

    public void setMedicalRecordId(Long medicalRecordId) {
        this.medicalRecordId = medicalRecordId;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public List<MedicineResponse> getMedicines() {
        return medicines;
    }

    public void setMedicines(List<MedicineResponse> medicines) {
        this.medicines = medicines;
    }
}
