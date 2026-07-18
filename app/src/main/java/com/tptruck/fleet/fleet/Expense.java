package com.tptruck.fleet.fleet;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A financial overhead attached to a truck: fuel (carburant), maintenance,
 * traffic tickets, insurance, tolls, etc.
 */
@Entity
@Table(name = "expense")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpenseType type;

    @NotNull
    @PositiveOrZero
    @Column(name = "amount_mad", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountMad;

    @NotNull
    @Column(name = "incurred_on", nullable = false)
    private LocalDate incurredOn;

    @Column(length = 500)
    private String notes;

    protected Expense() {
    }

    public Expense(Long truckId, ExpenseType type, BigDecimal amountMad, LocalDate incurredOn, String notes) {
        this.truckId = truckId;
        this.type = type;
        this.amountMad = amountMad;
        this.incurredOn = incurredOn;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public Long getTruckId() {
        return truckId;
    }

    public void setTruckId(Long truckId) {
        this.truckId = truckId;
    }

    public ExpenseType getType() {
        return type;
    }

    public void setType(ExpenseType type) {
        this.type = type;
    }

    public BigDecimal getAmountMad() {
        return amountMad;
    }

    public void setAmountMad(BigDecimal amountMad) {
        this.amountMad = amountMad;
    }

    public LocalDate getIncurredOn() {
        return incurredOn;
    }

    public void setIncurredOn(LocalDate incurredOn) {
        this.incurredOn = incurredOn;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
