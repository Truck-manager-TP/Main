package com.tptruck.fleet.map;

import com.tptruck.fleet.route.RouteScope;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/map")
public class MapController {

    private final TrackingService trackingService;

    public MapController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @GetMapping("/live")
    public List<LiveTruckView> liveFleet() {
        return trackingService.liveFleet();
    }

    @GetMapping("/routes/{id}/trajectory")
    public RouteTrajectoryView trajectory(@PathVariable Long id) {
        return trackingService.trajectory(id);
    }

    @GetMapping("/relay-points")
    public List<RelayPointView> relayPoints(@RequestParam(required = false) RouteScope scope) {
        return trackingService.relayPoints(scope);
    }
}
