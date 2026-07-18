package com.tptruck.fleet.map;

import java.time.Instant;

public record TrajectoryPointView(int seq, double latitude, double longitude, Instant recordedAt) {
}
