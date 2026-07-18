package com.tptruck.fleet.map;

public record PositionIngestRequest(
        double lat,
        double lng,
        Double speedKmh,
        Short headingDeg) {
}
