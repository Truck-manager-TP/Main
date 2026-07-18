package com.tptruck.fleet.fleet;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fleet")
public class FleetController {

    private final FleetService fleetService;

    public FleetController(FleetService fleetService) {
        this.fleetService = fleetService;
    }

    @GetMapping("/trucks")
    public List<Truck> listTrucks() {
        return fleetService.listTrucks();
    }

    @GetMapping("/trucks/available")
    public List<Truck> availableTrucks() {
        return fleetService.availableTrucks();
    }

    @GetMapping("/trucks/{id}")
    public Truck getTruck(@PathVariable Long id) {
        return fleetService.getTruck(id);
    }

    @PostMapping("/trucks")
    @ResponseStatus(HttpStatus.CREATED)
    public Truck registerTruck(@Valid @RequestBody Truck truck) {
        return fleetService.registerTruck(truck);
    }

    @PatchMapping("/trucks/{id}/status")
    public Truck changeStatus(@PathVariable Long id, @RequestParam TruckStatus status) {
        return fleetService.changeStatus(id, status);
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public Expense recordExpense(@Valid @RequestBody Expense expense) {
        return fleetService.recordExpense(expense);
    }

    @GetMapping("/trucks/{id}/overhead")
    public ResponseEntity<Map<String, Object>> overhead(@PathVariable Long id) {
        BigDecimal total = fleetService.totalOverheadForTruck(id);
        return ResponseEntity.ok(Map.of("truckId", id, "totalOverheadMad", total));
    }
}
