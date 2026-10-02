package com.mediqr.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

@Service
public class QrService {

    private static final Logger logger = LoggerFactory.getLogger(QrService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    @Value("${mediqr.app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Generates a unique cryptographically secure QR token.
     * Format: MEDIQR-PAT-{RANDOM_ALPHANUMERIC}
     */
    public String generateUniqueQrToken() {
        StringBuilder sb = new StringBuilder("MEDIQR-PAT-");
        for (int i = 0; i < 4; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        sb.append("-");
        for (int i = 0; i < 4; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    /**
     * Builds the full patient access URL encoded into the QR code.
     * Example: http://localhost:8080/patient-record.html?token=MEDIQR-PAT-8831-ABCD
     */
    public String buildAccessUrl(String qrToken) {
        return baseUrl + "/patient-record.html?token=" + qrToken;
    }

    /**
     * Generates a QR Code as PNG byte array using Google ZXing library.
     */
    public byte[] generateQrCodeImageBytes(String content, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | IOException e) {
            logger.error("Error generating QR code image: {}", e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Generates a Base64 data URL for easy display in frontend <img> tag.
     */
    public String generateQrCodeBase64(String content, int width, int height) {
        byte[] bytes = generateQrCodeImageBytes(content, width, height);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
    }
}
