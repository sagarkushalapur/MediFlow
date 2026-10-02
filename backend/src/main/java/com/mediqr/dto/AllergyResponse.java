package com.mediqr.dto;

public class AllergyResponse {

    private Long id;
    private String allergyName;
    private String description;

    public AllergyResponse() {
    }

    public AllergyResponse(Long id, String allergyName, String description) {
        this.id = id;
        this.allergyName = allergyName;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
