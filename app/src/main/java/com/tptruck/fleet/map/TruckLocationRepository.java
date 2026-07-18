package com.tptruck.fleet.map;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TruckLocationRepository extends JpaRepository<TruckLocation, Long> {
    List<TruckLocation> findByRouteIdOrderByRecordedAtAsc(Long routeId);
}
