package com.tptruck.fleet.route;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByStatus(RouteStatus status);

    List<Route> findByScope(RouteScope scope);
}
