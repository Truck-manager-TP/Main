package com.tptruck.fleet.driver;

import com.tptruck.fleet.route.RouteScope;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DriverComplianceServiceTest {

    private final DriverComplianceService service = new DriverComplianceService();
    private final LocalDate today = LocalDate.of(2026, 7, 18);

    private Driver domestic() {
        return new Driver("Domestic Driver", "DL-1", DriverType.DOMESTIC, today.plusYears(2));
    }

    private Driver international() {
        Driver d = new Driver("Intl Driver", "DL-2", DriverType.INTERNATIONAL, today.plusYears(2));
        d.setPassportExpiry(today.plusYears(3));
        d.setInternationalPermitExpiry(today.plusYears(1));
        return d;
    }

    @Test
    void domesticDriverCanDriveDomesticRoute() {
        assertTrue(service.isEligibleForScope(domestic(), RouteScope.DOMESTIC, today));
    }

    @Test
    void domesticDriverCannotDriveInternationalRoute() {
        assertFalse(service.isEligibleForScope(domestic(), RouteScope.INTERNATIONAL, today));
    }

    @Test
    void internationalDriverWithValidPapersCanCrossBorder() {
        assertTrue(service.isEligibleForScope(international(), RouteScope.INTERNATIONAL, today));
    }

    @Test
    void expiredLicenseBlocksAllScopes() {
        Driver d = domestic();
        d.setLicenseExpiry(today.minusDays(1));
        assertFalse(service.isEligibleForScope(d, RouteScope.DOMESTIC, today));
    }

    @Test
    void internationalDriverWithExpiredPermitCannotCrossBorder() {
        Driver d = international();
        d.setInternationalPermitExpiry(today.minusDays(1));
        assertFalse(service.isEligibleForScope(d, RouteScope.INTERNATIONAL, today));
    }

    @Test
    void nullArgumentsAreNotEligible() {
        assertFalse(service.isEligibleForScope(null, RouteScope.DOMESTIC, today));
        assertFalse(service.isEligibleForScope(domestic(), null, today));
        assertFalse(service.isEligibleForScope(domestic(), RouteScope.DOMESTIC, null));
    }
}
