package com.tptruck.fleet.route;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteRepository routeRepository;

    public RouteController(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @GetMapping
    public List<Route> list(@RequestParam(required = false) RouteStatus status) {
        return status == null ? routeRepository.findAll() : routeRepository.findByStatus(status);
    }

    @GetMapping("/live")
    public List<Route> live() {
        return routeRepository.findByStatus(RouteStatus.IN_TRANSIT);
    }

    @GetMapping("/{id}")
    public Route get(@PathVariable Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Route not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Route create(@Valid @RequestBody Route route) {
        return routeRepository.save(route);
    }

    @PostMapping("/{id}/position")
    public Route updatePosition(@PathVariable Long id,
                                @RequestParam double lat,
                                @RequestParam double lng) {
        Route route = get(id);
        route.updatePosition(lat, lng);
        route.setStatus(RouteStatus.IN_TRANSIT);
        return routeRepository.save(route);
    }
}
