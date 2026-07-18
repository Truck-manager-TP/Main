package com.tptruck.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the TP-Truck Fleet &amp; Logistics Management platform.
 * Bundles the four business capabilities: Fleet/Expense, Route Tracking,
 * Driver Management and Marketing &amp; Growth.
 */
@SpringBootApplication
public class TruckFleetApplication {

    public static void main(String[] args) {
        SpringApplication.run(TruckFleetApplication.class, args);
    }
}
