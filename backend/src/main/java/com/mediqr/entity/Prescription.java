package com.mediqr.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false, unique = true, updatable = false)
    private MedicalRecord medicalRecord;

    @Column(name = "prescription_date", nullable = false, updatable = false)
    private LocalDate prescriptionDate;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Medicine> medicines = new ArrayList<>();

    public Prescription() {
    }

    public Prescription(MedicalRecord medicalRecord, LocalDate prescriptionDate) {
        this.medicalRecord = medicalRecord;
        this.prescriptionDate = prescriptionDate;
    }

    @PrePersist
    protected void onCreate() {
        if (this.prescriptionDate == null) {
            this.prescriptionDate = LocalDate.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MedicalRecord getMedicalRecord() {
        return medicalRecord;
    }

    public void setMedicalRecord(MedicalRecord medicalRecord) {
        this.medicalRecord = medicalRecord;
    }

    public LocalDate getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(LocalDate prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public List<Medicine> getMedicines() {
        return medicines;
    }

    public void setMedicines(List<Medicine> medicines) {
        this.medicines = medicines;
    }

    public void addMedicine(Medicine medicine) {
        medicines.add(medicine);
        medicine.setPrescription(this);
    }
}
