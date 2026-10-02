package com.mediqr.repository;

import com.mediqr.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByPrescriptionId(Long prescriptionId);

    List<Medicine> findByPrescriptionMedicalRecordPatientId(Long patientId);
}
