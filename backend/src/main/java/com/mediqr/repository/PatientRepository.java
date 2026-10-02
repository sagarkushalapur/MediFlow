package com.mediqr.repository;

import com.mediqr.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUserId(Long userId);

    Optional<Patient> findByQrToken(String qrToken);

    boolean existsByQrToken(String qrToken);
}
