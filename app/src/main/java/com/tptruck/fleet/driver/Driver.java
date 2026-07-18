package com.tptruck.fleet.driver;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * A driver profile. Type distinguishes DOMESTIC drivers (Morocco only) from
 * INTERNATIONAL drivers cleared for cross-border journeys. International
 * drivers require a valid passport and an in-date international permit.
 */
@Entity
@Table(name = "driver")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank
    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriverType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriverAvailability availability = DriverAvailability.AVAILABLE;

    @Column(name = "license_expiry", nullable = false)
    private LocalDate licenseExpiry;

    @Column(name = "passport_expiry")
    private LocalDate passportExpiry;

    @Column(name = "international_permit_expiry")
    private LocalDate internationalPermitExpiry;

    protected Driver() {
    }

    public Driver(String fullName, String licenseNumber, DriverType type, LocalDate licenseExpiry) {
        this.fullName = fullName;
        this.licenseNumber = licenseNumber;
        this.type = type;
        this.licenseExpiry = licenseExpiry;
        this.availability = DriverAvailability.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public DriverType getType() {
        return type;
    }

    public void setType(DriverType type) {
        this.type = type;
    }

    public DriverAvailability getAvailability() {
        return availability;
    }

    public void setAvailability(DriverAvailability availability) {
        this.availability = availability;
    }

    public LocalDate getLicenseExpiry() {
        return licenseExpiry;
    }

    public void setLicenseExpiry(LocalDate licenseExpiry) {
        this.licenseExpiry = licenseExpiry;
    }

    public LocalDate getPassportExpiry() {
        return passportExpiry;
    }

    public void setPassportExpiry(LocalDate passportExpiry) {
        this.passportExpiry = passportExpiry;
    }

    public LocalDate getInternationalPermitExpiry() {
        return internationalPermitExpiry;
    }

    public void setInternationalPermitExpiry(LocalDate internationalPermitExpiry) {
        this.internationalPermitExpiry = internationalPermitExpiry;
    }
}
