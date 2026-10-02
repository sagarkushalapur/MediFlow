package com.mediqr.service;

import com.mediqr.dto.*;
import com.mediqr.entity.*;
import com.mediqr.exception.ResourceNotFoundException;
import com.mediqr.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PatientService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AllergyRepository allergyRepository;
    private final MedicineRepository medicineRepository;
    private final QrService qrService;

    public PatientService(UserRepository userRepository,
                          PatientRepository patientRepository,
                          MedicalRecordRepository medicalRecordRepository,
                          AllergyRepository allergyRepository,
                          MedicineRepository medicineRepository,
                          QrService qrService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.allergyRepository = allergyRepository;
        this.medicineRepository = medicineRepository;
        this.qrService = qrService;
    }

    private Patient findPatientByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + email));
    }

    public PatientProfileResponse getProfile(String email) {
        Patient patient = findPatientByEmail(email);
        List<Allergy> allergies = allergyRepository.findByPatientId(patient.getId());

        PatientProfileResponse response = new PatientProfileResponse();
        response.setId(patient.getId());
        response.setUserId(patient.getUser().getId());
        response.setName(patient.getUser().getName());
        response.setEmail(patient.getUser().getEmail());
        response.setDateOfBirth(patient.getDateOfBirth());
        response.setGender(patient.getGender());
        response.setBloodGroup(patient.getBloodGroup());
        response.setPhone(patient.getPhone());
        response.setAddress(patient.getAddress());
        response.setQrToken(patient.getQrToken());

        response.setAllergies(allergies.stream()
                .map(a -> new AllergyResponse(a.getId(), a.getAllergyName(), a.getDescription()))
                .collect(Collectors.toList()));

        return response;
    }

    public List<MedicalRecordResponse> getMedicalHistory(String email) {
        Patient patient = findPatientByEmail(email);
        return mapRecordsToResponse(medicalRecordRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patient.getId()));
    }

    public List<PrescriptionResponse> getPrescriptions(String email) {
        Patient patient = findPatientByEmail(email);
        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patient.getId());

        List<PrescriptionResponse> prescriptions = new ArrayList<>();
        for (MedicalRecord record : records) {
            if (record.getPrescription() != null) {
                prescriptions.add(mapPrescriptionToResponse(record.getPrescription()));
            }
        }
        return prescriptions;
    }

    public List<MedicineResponse> getMedicines(String email) {
        Patient patient = findPatientByEmail(email);
        List<Medicine> medicines = medicineRepository.findByPrescriptionMedicalRecordPatientId(patient.getId());

        return medicines.stream()
                .map(m -> new MedicineResponse(m.getId(), m.getMedicineName(), m.getDosage(), m.getFrequency(), m.getDuration(), m.getInstructions()))
                .collect(Collectors.toList());
    }

    public QrResponse getQrCode(String email) {
        Patient patient = findPatientByEmail(email);
        String accessUrl = qrService.buildAccessUrl(patient.getQrToken());
        String qrImageBase64 = qrService.generateQrCodeBase64(accessUrl, 320, 320);

        return new QrResponse(patient.getId(), patient.getUser().getName(), patient.getQrToken(), qrImageBase64, accessUrl);
    }

    public List<MedicalRecordResponse> mapRecordsToResponse(List<MedicalRecord> records) {
        return records.stream().map(record -> {
            MedicalRecordResponse response = new MedicalRecordResponse();
            response.setId(record.getId());
            response.setPatientId(record.getPatient().getId());
            response.setPatientName(record.getPatient().getUser().getName());
            response.setDoctorId(record.getDoctor().getId());
            response.setDoctorName(record.getDoctor().getUser().getName());
            response.setDoctorSpecialization(record.getDoctor().getSpecialization());
            response.setHospitalName(record.getDoctor().getHospitalName());
            response.setDiagnosis(record.getDiagnosis());
            response.setSymptoms(record.getSymptoms());
            response.setNotes(record.getNotes());
            response.setVisitDate(record.getVisitDate());
            response.setCreatedAt(record.getCreatedAt());

            if (record.getPrescription() != null) {
                response.setPrescription(mapPrescriptionToResponse(record.getPrescription()));
            }
            return response;
        }).collect(Collectors.toList());
    }

    public PrescriptionResponse mapPrescriptionToResponse(Prescription prescription) {
        PrescriptionResponse response = new PrescriptionResponse();
        response.setId(prescription.getId());
        response.setMedicalRecordId(prescription.getMedicalRecord().getId());
        response.setPrescriptionDate(prescription.getPrescriptionDate());

        if (prescription.getMedicines() != null) {
            response.setMedicines(prescription.getMedicines().stream()
                    .map(m -> new MedicineResponse(m.getId(), m.getMedicineName(), m.getDosage(), m.getFrequency(), m.getDuration(), m.getInstructions()))
                    .collect(Collectors.toList()));
        }
        return response;
    }
}
