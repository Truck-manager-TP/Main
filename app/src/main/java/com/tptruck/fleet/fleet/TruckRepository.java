package com.tptruck.fleet.fleet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TruckRepository extends JpaRepository<Truck, Long> {
    List<Truck> findByStatus(TruckStatus status);

    List<Truck> findByClassification(TruckClassification classification);
}
