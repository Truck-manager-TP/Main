package com.tptruck.fleet.map;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "route_trajectory_point")
public class RouteTrajectoryPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(nullable = false)
    private int seq;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "point_type", nullable = false, length = 16)
    private TrajectoryPointType pointType = TrajectoryPointType.ACTUAL;

    @Column(name = "recorded_at")
    private Instant recordedAt;

    protected RouteTrajectoryPoint() {
    }

    public RouteTrajectoryPoint(Long routeId, int seq, double latitude, double longitude,
                                TrajectoryPointType pointType, Instant recordedAt) {
        this.routeId = routeId;
        this.seq = seq;
        this.latitude = latitude;
        this.longitude = longitude;
        this.pointType = pointType;
        this.recordedAt = recordedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getRouteId() {
        return routeId;
    }

    public int getSeq() {
        return seq;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public TrajectoryPointType getPointType() {
        return pointType;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }
}
