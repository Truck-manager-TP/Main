package com.tptruck.fleet.route;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * A transport route. Scope distinguishes DOMESTIC (within Morocco) from
 * INTERNATIONAL (cross-border) journeys, which drives regulatory checks.
 */
@Entity
@Table(name = "route")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String origin;

    @NotBlank
    @Column(nullable = false)
    private String destination;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RouteScope scope;

    @Column(name = "truck_id")
    private Long truckId;

    @Column(name = "driver_id")
    private Long driverId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RouteStatus status = RouteStatus.PLANNED;

    @Column(name = "distance_km")
    private double distanceKm;

    @Column(name = "last_known_lat")
    private Double lastKnownLat;

    @Column(name = "last_known_lng")
    private Double lastKnownLng;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    protected Route() {
    }

    public Route(String origin, String destination, RouteScope scope, double distanceKm) {
        this.origin = origin;
        this.destination = destination;
        this.scope = scope;
        this.distanceKm = distanceKm;
        this.status = RouteStatus.PLANNED;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public RouteScope getScope() {
        return scope;
    }

    public void setScope(RouteScope scope) {
        this.scope = scope;
    }

    public Long getTruckId() {
        return truckId;
    }

    public void setTruckId(Long truckId) {
        this.truckId = truckId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public RouteStatus getStatus() {
        return status;
    }

    public void setStatus(RouteStatus status) {
        this.status = status;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getLastKnownLat() {
        return lastKnownLat;
    }

    public Double getLastKnownLng() {
        return lastKnownLng;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updatePosition(double lat, double lng) {
        this.lastKnownLat = lat;
        this.lastKnownLng = lng;
        this.updatedAt = Instant.now();
    }
}
