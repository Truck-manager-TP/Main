package com.tptruck.fleet.map;

public record RelayPointView(
        Long id,
        String code,
        String name,
        RelayPointType type,
        double latitude,
        double longitude,
        String countryCode,
        String address,
        String scope) {
}
