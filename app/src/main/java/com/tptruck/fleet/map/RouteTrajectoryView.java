package com.tptruck.fleet.map;

import java.util.List;

public record RouteTrajectoryView(
        Long routeId,
        List<TrajectoryPointView> actual,
        List<TrajectoryPointView> planned) {
}
