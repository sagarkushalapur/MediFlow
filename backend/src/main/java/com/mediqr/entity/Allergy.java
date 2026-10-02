package com.mediqr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "allergies")
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "allergy_name", nullable = false, length = 100)
    private String allergyName;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Allergy() {
    }

    public Allergy(Patient patient, String allergyName, String description) {
        this.patient = patient;
        this.allergyName = allergyName;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public String getAllergyName() {
        return allergyName;
    }

    public void setAllergyName(String allergyName) {
        this.allergyName = allergyName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
