package com.tptruck.fleet.fleet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class FleetService {

    private final TruckRepository truckRepository;
    private final ExpenseRepository expenseRepository;

    public FleetService(TruckRepository truckRepository, ExpenseRepository expenseRepository) {
        this.truckRepository = truckRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Truck> listTrucks() {
        return truckRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Truck getTruck(Long id) {
        return truckRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Truck not found: " + id));
    }

    public Truck registerTruck(Truck truck) {
        return truckRepository.save(truck);
    }

    public Truck changeStatus(Long id, TruckStatus status) {
        Truck truck = getTruck(id);
        truck.setStatus(status);
        return truckRepository.save(truck);
    }

    public Expense recordExpense(Expense expense) {
        // Guard: the truck must exist before an overhead can be booked against it.
        getTruck(expense.getTruckId());
        return expenseRepository.save(expense);
    }

    @Transactional(readOnly = true)
    public BigDecimal totalOverheadForTruck(Long truckId) {
        return expenseRepository.findByTruckId(truckId).stream()
                .map(Expense::getAmountMad)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public List<Truck> availableTrucks() {
        return truckRepository.findByStatus(TruckStatus.AVAILABLE);
    }
}
