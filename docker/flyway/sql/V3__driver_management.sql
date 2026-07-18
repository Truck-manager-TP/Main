-- V3: Driver Management (Gestion des Drivers) schema
CREATE TABLE driver (
    id                         BIGSERIAL PRIMARY KEY,
    full_name                  VARCHAR(128) NOT NULL,
    license_number             VARCHAR(64)  NOT NULL UNIQUE,
    type                       VARCHAR(32)  NOT NULL,   -- DOMESTIC | INTERNATIONAL
    availability               VARCHAR(32)  NOT NULL DEFAULT 'AVAILABLE',
    license_expiry             DATE         NOT NULL,
    passport_expiry            DATE,
    international_permit_expiry DATE
);

-- Link routes to drivers now that the driver table exists.
ALTER TABLE route
    ADD CONSTRAINT fk_route_driver
    FOREIGN KEY (driver_id) REFERENCES driver(id) ON DELETE SET NULL;

CREATE INDEX idx_driver_availability ON driver(availability);
CREATE INDEX idx_driver_type         ON driver(type);
