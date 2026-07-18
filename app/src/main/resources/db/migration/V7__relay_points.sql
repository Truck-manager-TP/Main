-- V7: Company-approved relay points (rest stops, fuel, transfer hubs)

CREATE TABLE relay_point (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR(32)  NOT NULL UNIQUE,
    name         VARCHAR(128) NOT NULL,
    type         VARCHAR(32)  NOT NULL,
    latitude     DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude    DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    country_code CHAR(2)       NOT NULL DEFAULT 'MA',
    address      VARCHAR(256),
    is_active    BOOLEAN       NOT NULL DEFAULT true,
    scope        VARCHAR(32)   NOT NULL DEFAULT 'DOMESTIC',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_relay_point_type  ON relay_point(type) WHERE is_active;
CREATE INDEX idx_relay_point_scope ON relay_point(scope) WHERE is_active;

INSERT INTO relay_point (code, name, type, latitude, longitude, country_code, scope, address) VALUES
    ('REL-CAS-001', 'Aire de repos Casablanca Nord', 'REST_STOP',       33.5731, -7.5898, 'MA', 'DOMESTIC',      'Autoroute A1, Casablanca'),
    ('REL-AGD-001', 'Station Total Agadir',          'FUEL_STATION',    30.4278, -9.5981, 'MA', 'DOMESTIC',      'Route de Marrakech, Agadir'),
    ('REL-TNG-001', 'Hub logistique Tanger Med',     'LOGISTICS_HUB',   35.8897, -5.5473, 'MA', 'INTERNATIONAL', 'Zone Franche, Tanger Med'),
    ('REL-ALG-001', 'Poste frontiere Maghreb',       'BORDER_CROSSING', 35.7597, -5.8340, 'MA', 'INTERNATIONAL', 'Frontiere MA-ES');
