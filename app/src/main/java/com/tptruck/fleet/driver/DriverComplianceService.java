package com.tptruck.fleet.driver;

import com.tptruck.fleet.route.RouteScope;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Encapsulates the regulatory rules that decide whether a driver may be
 * assigned to a given route scope. Kept free of framework/IO so it is trivial
 * to unit test and therefore contributes real coverage to the SonarQube gate.
 */
@Service
public class DriverComplianceService {

    public boolean isEligibleForScope(Driver driver, RouteScope scope, LocalDate onDate) {
        if (driver == null || scope == null || onDate == null) {
            return false;
        }
        if (isExpired(driver.getLicenseExpiry(), onDate)) {
            return false;
        }
        if (scope == RouteScope.DOMESTIC) {
            return true;
        }
        // INTERNATIONAL journeys require a cross-border driver with valid papers.
        if (driver.getType() != DriverType.INTERNATIONAL) {
            return false;
        }
        return !isExpired(driver.getPassportExpiry(), onDate)
                && !isExpired(driver.getInternationalPermitExpiry(), onDate);
    }

    private boolean isExpired(LocalDate expiry, LocalDate onDate) {
        return expiry == null || expiry.isBefore(onDate);
    }
}
