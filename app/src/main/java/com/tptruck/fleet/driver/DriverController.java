package com.tptruck.fleet.driver;

import com.tptruck.fleet.route.RouteScope;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/drivers")
public class DriverController {

    private final DriverRepository driverRepository;
    private final DriverComplianceService complianceService;

    public DriverController(DriverRepository driverRepository, DriverComplianceService complianceService) {
        this.driverRepository = driverRepository;
        this.complianceService = complianceService;
    }

    @GetMapping
    public List<Driver> list(@RequestParam(required = false) DriverAvailability availability) {
        return availability == null ? driverRepository.findAll()
                : driverRepository.findByAvailability(availability);
    }

    @GetMapping("/available")
    public List<Driver> available() {
        return driverRepository.findByAvailability(DriverAvailability.AVAILABLE);
    }

    @GetMapping("/{id}")
    public Driver get(@PathVariable Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Driver not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Driver create(@Valid @RequestBody Driver driver) {
        return driverRepository.save(driver);
    }

    @PatchMapping("/{id}/availability")
    public Driver setAvailability(@PathVariable Long id, @RequestParam DriverAvailability availability) {
        Driver driver = get(id);
        driver.setAvailability(availability);
        return driverRepository.save(driver);
    }

    @GetMapping("/{id}/eligibility")
    public Map<String, Object> eligibility(@PathVariable Long id, @RequestParam RouteScope scope) {
        Driver driver = get(id);
        boolean eligible = complianceService.isEligibleForScope(driver, scope, LocalDate.now());
        return Map.of("driverId", id, "scope", scope, "eligible", eligible);
    }
}
