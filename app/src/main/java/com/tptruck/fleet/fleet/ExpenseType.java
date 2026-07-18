package com.tptruck.fleet.fleet;

/**
 * Categories of financial overhead tracked against a truck.
 * FUEL == "carburant" in the business domain language.
 */
public enum ExpenseType {
    FUEL,
    MAINTENANCE,
    TRAFFIC_TICKET,
    INSURANCE,
    TOLL,
    TYRES,
    OTHER
}
