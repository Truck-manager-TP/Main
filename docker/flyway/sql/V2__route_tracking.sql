-- V2: Route Tracking (Suivi d'itineraire) schema
CREATE TABLE route (
    id             BIGSERIAL PRIMARY KEY,
    origin         VARCHAR(128) NOT NULL,
    destination    VARCHAR(128) NOT NULL,
    scope          VARCHAR(32)  NOT NULL,          -- DOMESTIC | INTERNATIONAL
    truck_id       BIGINT       REFERENCES truck(id) ON DELETE SET NULL,
    driver_id      BIGINT,
    status         VARCHAR(32)  NOT NULL DEFAULT 'PLANNED',
    distance_km    DOUBLE PRECISION NOT NULL DEFAULT 0,
    last_known_lat DOUBLE PRECISION,
    last_known_lng DOUBLE PRECISION,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_status ON route(status);
CREATE INDEX idx_route_scope  ON route(scope);
