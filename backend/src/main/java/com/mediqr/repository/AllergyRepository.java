package com.mediqr.repository;

import com.mediqr.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllergyRepository extends JpaRepository<Allergy, Long> {

    List<Allergy> findByPatientId(Long patientId);
}
