package com.mediqr.dto;

public class QrResponse {

    private Long patientId;
    private String patientName;
    private String qrToken;
    private String qrCodeBase64;
    private String accessUrl;

    public QrResponse() {
    }

    public QrResponse(Long patientId, String patientName, String qrToken, String qrCodeBase64, String accessUrl) {
        this.patientId = patientId;
        this.patientName = patientName;
        this.qrToken = qrToken;
        this.qrCodeBase64 = qrCodeBase64;
        this.accessUrl = accessUrl;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getQrCodeBase64() {
        return qrCodeBase64;
    }

    public void setQrCodeBase64(String qrCodeBase64) {
        this.qrCodeBase64 = qrCodeBase64;
    }

    public String getAccessUrl() {
        return accessUrl;
    }

    public void setAccessUrl(String accessUrl) {
        this.accessUrl = accessUrl;
    }
}
