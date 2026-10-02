package com.mediqr.repository;

import com.mediqr.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByVisitDateDescCreatedAtDesc(Long patientId);

    List<MedicalRecord> findByDoctorIdOrderByVisitDateDescCreatedAtDesc(Long doctorId);
}
