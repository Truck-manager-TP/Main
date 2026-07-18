package com.tptruck.fleet.fleet;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FleetServiceTest {

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private FleetService fleetService;

    private Truck truck;

    @BeforeEach
    void setUp() {
        truck = new Truck("1234-A-56", "Volvo", "FH16", TruckClassification.REFRIGERATED, 24.0);
    }

    @Test
    void registerTruckPersists() {
        when(truckRepository.save(any(Truck.class))).thenReturn(truck);
        Truck saved = fleetService.registerTruck(truck);
        assertEquals("1234-A-56", saved.getRegistrationPlate());
        verify(truckRepository).save(truck);
    }

    @Test
    void getTruckThrowsWhenMissing() {
        when(truckRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(NoSuchElementException.class, () -> fleetService.getTruck(99L));
    }

    @Test
    void changeStatusUpdatesTruck() {
        when(truckRepository.findById(1L)).thenReturn(Optional.of(truck));
        when(truckRepository.save(any(Truck.class))).thenAnswer(inv -> inv.getArgument(0));
        Truck updated = fleetService.changeStatus(1L, TruckStatus.MAINTENANCE);
        assertEquals(TruckStatus.MAINTENANCE, updated.getStatus());
    }

    @Test
    void recordExpenseRequiresExistingTruck() {
        when(truckRepository.findById(1L)).thenReturn(Optional.of(truck));
        Expense expense = new Expense(1L, ExpenseType.FUEL, new BigDecimal("1500.00"), LocalDate.now(), "Diesel");
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));
        Expense saved = fleetService.recordExpense(expense);
        assertEquals(ExpenseType.FUEL, saved.getType());
    }

    @Test
    void recordExpenseFailsForUnknownTruck() {
        when(truckRepository.findById(7L)).thenReturn(Optional.empty());
        Expense expense = new Expense(7L, ExpenseType.FUEL, new BigDecimal("10.00"), LocalDate.now(), null);
        assertThrows(NoSuchElementException.class, () -> fleetService.recordExpense(expense));
        verify(expenseRepository, never()).save(any());
    }

    @Test
    void totalOverheadSumsExpenses() {
        when(expenseRepository.findByTruckId(1L)).thenReturn(List.of(
                new Expense(1L, ExpenseType.FUEL, new BigDecimal("1200.50"), LocalDate.now(), null),
                new Expense(1L, ExpenseType.TRAFFIC_TICKET, new BigDecimal("300.00"), LocalDate.now(), null)));
        assertEquals(new BigDecimal("1500.50"), fleetService.totalOverheadForTruck(1L));
    }
}
