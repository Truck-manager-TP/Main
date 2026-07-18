package com.tptruck.fleet.fleet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTruckId(Long truckId);

    List<Expense> findByType(ExpenseType type);
}
