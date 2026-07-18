package com.tptruck.fleet.map;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RelayPointRepository extends JpaRepository<RelayPoint, Long> {
    List<RelayPoint> findByActiveTrueOrderByNameAsc();

    List<RelayPoint> findByActiveTrueAndScopeInOrderByNameAsc(List<String> scopes);
}
