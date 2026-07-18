package com.tptruck.fleet.map;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteTrajectoryPointRepository extends JpaRepository<RouteTrajectoryPoint, Long> {
    List<RouteTrajectoryPoint> findByRouteIdAndPointTypeOrderBySeqAsc(
            Long routeId, TrajectoryPointType pointType);
}
