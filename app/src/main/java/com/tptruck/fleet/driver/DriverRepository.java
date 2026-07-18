package com.tptruck.fleet.driver;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByAvailability(DriverAvailability availability);

    List<Driver> findByType(DriverType type);
}
