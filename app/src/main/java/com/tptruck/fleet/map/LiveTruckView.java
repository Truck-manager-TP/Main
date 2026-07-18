package com.tptruck.fleet.map;

import com.tptruck.fleet.route.RouteScope;
import com.tptruck.fleet.route.RouteStatus;

import java.time.Instant;

public record LiveTruckView(
        Long routeId,
        Long truckId,
        String origin,
        String destination,
        RouteScope scope,
        RouteStatus status,
        double latitude,
        double longitude,
        Instant updatedAt) {
}
