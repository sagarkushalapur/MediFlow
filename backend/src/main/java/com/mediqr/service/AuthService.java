package com.mediqr.service;

import com.mediqr.dto.*;
import com.mediqr.entity.*;
import com.mediqr.exception.BadRequestException;
import com.mediqr.exception.ResourceNotFoundException;
import com.mediqr.repository.*;
import com.mediqr.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AllergyRepository allergyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final QrService qrService;

    public AuthService(UserRepository userRepository,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       AllergyRepository allergyRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtils jwtUtils,
                       QrService qrService) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.allergyRepository = allergyRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.qrService = qrService;
    }

    @Transactional
    public AuthResponse registerPatient(PatientRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        // Create and save User
        User user = new User(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_PATIENT
        );
        user = userRepository.save(user);

        // Generate unique QR token
        String qrToken;
        do {
            qrToken = qrService.generateUniqueQrToken();
        } while (patientRepository.existsByQrToken(qrToken));

        // Create and save Patient
        Patient patient = new Patient(
                user,
                request.getDateOfBirth(),
                request.getGender(),
                request.getBloodGroup(),
                request.getPhone(),
                request.getAddress(),
                qrToken
        );
        patient = patientRepository.save(patient);

        // Save allergies if provided
        if (request.getAllergies() != null && !request.getAllergies().isEmpty()) {
            for (String allergyName : request.getAllergies()) {
                if (allergyName != null && !allergyName.trim().isEmpty()) {
                    Allergy allergy = new Allergy(patient, allergyName.trim(), "Reported during registration");
                    allergyRepository.save(allergy);
                }
            }
        }

        // Generate JWT
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        AuthResponse response = new AuthResponse(token, user.getId(), patient.getId(), user.getName(), user.getEmail(), user.getRole().name());
        response.setQrToken(patient.getQrToken());
        return response;
    }

    @Transactional
    public AuthResponse registerDoctor(DoctorRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        // Create and save User
        User user = new User(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_DOCTOR
        );
        user = userRepository.save(user);

        // Create and save Doctor
        Doctor doctor = new Doctor(
                user,
                request.getSpecialization().trim(),
                request.getHospitalName().trim()
        );
        doctor = doctorRepository.save(doctor);

        // Generate JWT
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        AuthResponse response = new AuthResponse(token, user.getId(), doctor.getId(), user.getName(), user.getEmail(), user.getRole().name());
        response.setSpecialization(doctor.getSpecialization());
        response.setHospitalName(doctor.getHospitalName());
        return response;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());

        if (user.getRole() == Role.ROLE_PATIENT) {
            Patient patient = patientRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + user.getId()));
            response.setRoleId(patient.getId());
            response.setQrToken(patient.getQrToken());
        } else if (user.getRole() == Role.ROLE_DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + user.getId()));
            response.setRoleId(doctor.getId());
            response.setSpecialization(doctor.getSpecialization());
            response.setHospitalName(doctor.getHospitalName());
        }

        return response;
    }
}
