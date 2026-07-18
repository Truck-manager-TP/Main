package com.tptruck.fleet.fleet;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * A truck in the fleet. Classification captures the type of stock/products the
 * unit is certified to carry (e.g. REFRIGERATED, HAZMAT, BULK).
 */
@Entity
@Table(name = "truck")
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "registration_plate", nullable = false, unique = true)
    private String registrationPlate;

    @NotBlank
    @Column(nullable = false)
    private String make;

    @NotBlank
    @Column(nullable = false)
    private String model;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TruckClassification classification;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TruckStatus status = TruckStatus.AVAILABLE;

    @Column(name = "capacity_tons", nullable = false)
    private double capacityTons;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Truck() {
    }

    public Truck(String registrationPlate, String make, String model,
                 TruckClassification classification, double capacityTons) {
        this.registrationPlate = registrationPlate;
        this.make = make;
        this.model = model;
        this.classification = classification;
        this.capacityTons = capacityTons;
        this.status = TruckStatus.AVAILABLE;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getRegistrationPlate() {
        return registrationPlate;
    }

    public void setRegistrationPlate(String registrationPlate) {
        this.registrationPlate = registrationPlate;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public TruckClassification getClassification() {
        return classification;
    }

    public void setClassification(TruckClassification classification) {
        this.classification = classification;
    }

    public TruckStatus getStatus() {
        return status;
    }

    public void setStatus(TruckStatus status) {
        this.status = status;
    }

    public double getCapacityTons() {
        return capacityTons;
    }

    public void setCapacityTons(double capacityTons) {
        this.capacityTons = capacityTons;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
