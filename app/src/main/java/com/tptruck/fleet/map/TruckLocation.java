package com.tptruck.fleet.map;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "truck_location")
public class TruckLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "truck_id")
    private Long truckId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Column(name = "heading_deg")
    private Short headingDeg;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    @Column(nullable = false, length = 32)
    private String source = "GPS";

    protected TruckLocation() {
    }

    public TruckLocation(Long routeId, Long truckId, double latitude, double longitude,
                         Double speedKmh, Short headingDeg) {
        this.routeId = routeId;
        this.truckId = truckId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speedKmh = speedKmh;
        this.headingDeg = headingDeg;
        this.recordedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getRouteId() {
        return routeId;
    }

    public Long getTruckId() {
        return truckId;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public Double getSpeedKmh() {
        return speedKmh;
    }

    public Short getHeadingDeg() {
        return headingDeg;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public String getSource() {
        return source;
    }
}
