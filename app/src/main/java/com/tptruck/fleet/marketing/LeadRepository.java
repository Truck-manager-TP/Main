package com.tptruck.fleet.marketing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByStage(LeadStage stage);

    long countByStage(LeadStage stage);
}
