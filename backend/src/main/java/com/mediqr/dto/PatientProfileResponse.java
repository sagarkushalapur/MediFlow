package com.mediqr.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PatientProfileResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String phone;
    private String address;
    private String qrToken;
    private List<AllergyResponse> allergies = new ArrayList<>();

    public PatientProfileResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public List<AllergyResponse> getAllergies() {
        return allergies;
    }

    public void setAllergies(List<AllergyResponse> allergies) {
        this.allergies = allergies;
    }
}
