package com.mediqr.service;

import com.mediqr.dto.*;
import com.mediqr.entity.*;
import com.mediqr.exception.BadRequestException;
import com.mediqr.exception.ResourceNotFoundException;
import com.mediqr.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AllergyRepository allergyRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final PatientService patientService;

    public DoctorService(UserRepository userRepository,
                         DoctorRepository doctorRepository,
                         PatientRepository patientRepository,
                         AllergyRepository allergyRepository,
                         MedicalRecordRepository medicalRecordRepository,
                         PrescriptionRepository prescriptionRepository,
                         MedicineRepository medicineRepository,
                         PatientService patientService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.allergyRepository = allergyRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.patientService = patientService;
    }

    private Doctor findDoctorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + email));
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getPatientById(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + patientId));
        return buildPatientProfileResponse(patient);
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getPatientByQrToken(String qrToken) {
        Patient patient = patientRepository.findByQrToken(qrToken.trim())
                .orElseThrow(() -> new ResourceNotFoundException("No patient found with QR token: " + qrToken));
        return buildPatientProfileResponse(patient);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> getPatientHistory(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }
        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByVisitDateDescCreatedAtDesc(patientId);
        return patientService.mapRecordsToResponse(records);
    }

    /**
     * CORE REQUIREMENT:
     * Doctors can add a NEW consultation but CANNOT edit or delete old records.
     * Every consultation is saved as a new immutable entry.
     */
    @Transactional
    public MedicalRecordResponse addConsultation(String doctorEmail, ConsultationRequest request) {
        Doctor doctor = findDoctorByEmail(doctorEmail);

        Patient patient;
        if (request.getPatientId() != null) {
            patient = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + request.getPatientId()));
        } else if (request.getQrToken() != null && !request.getQrToken().trim().isEmpty()) {
            patient = patientRepository.findByQrToken(request.getQrToken().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with QR token: " + request.getQrToken()));
        } else {
            throw new BadRequestException("Either patientId or qrToken must be specified.");
        }

        // 1. Create a NEW medical record (NEVER overwriting old records)
        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setDiagnosis(request.getDiagnosis().trim());
        record.setSymptoms(request.getSymptoms() != null ? request.getSymptoms().trim() : null);
        record.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        record.setVisitDate(LocalDate.now());

        MedicalRecord savedRecord = medicalRecordRepository.save(record);

        // 2. Create and store prescription if medicines are prescribed
        if (request.getMedicines() != null && !request.getMedicines().isEmpty()) {
            Prescription prescription = new Prescription();
            prescription.setMedicalRecord(savedRecord);
            prescription.setPrescriptionDate(LocalDate.now());
            Prescription savedPrescription = prescriptionRepository.save(prescription);

            for (MedicineItemRequest medReq : request.getMedicines()) {
                if (medReq.getMedicineName() != null && !medReq.getMedicineName().trim().isEmpty()) {
                    Medicine medicine = new Medicine();
                    medicine.setPrescription(savedPrescription);
                    medicine.setMedicineName(medReq.getMedicineName().trim());
                    medicine.setDosage(medReq.getDosage() != null ? medReq.getDosage().trim() : "Standard");
                    medicine.setFrequency(medReq.getFrequency() != null ? medReq.getFrequency().trim() : "Once daily");
                    medicine.setDuration(medReq.getDuration() != null ? medReq.getDuration().trim() : "5 days");
                    medicine.setInstructions(medReq.getInstructions() != null ? medReq.getInstructions().trim() : "");
                    medicineRepository.save(medicine);
                    savedPrescription.addMedicine(medicine);
                }
            }
            savedRecord.setPrescription(savedPrescription);
        }

        return patientService.mapRecordsToResponse(List.of(savedRecord)).get(0);
    }

    private PatientProfileResponse buildPatientProfileResponse(Patient patient) {
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
}
