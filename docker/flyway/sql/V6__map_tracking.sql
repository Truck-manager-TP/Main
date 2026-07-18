-- V6: Real-time map tracking — GPS history & route trajectories

CREATE TABLE truck_location (
    id          BIGSERIAL PRIMARY KEY,
    route_id    BIGINT       NOT NULL REFERENCES route(id) ON DELETE CASCADE,
    truck_id    BIGINT       REFERENCES truck(id) ON DELETE SET NULL,
    latitude    DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude   DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    speed_kmh   DOUBLE PRECISION,
    heading_deg SMALLINT CHECK (heading_deg BETWEEN 0 AND 359),
    recorded_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    source      VARCHAR(32)  NOT NULL DEFAULT 'GPS'
);

CREATE INDEX idx_truck_location_route_time ON truck_location(route_id, recorded_at DESC);
CREATE INDEX idx_truck_location_truck_time ON truck_location(truck_id, recorded_at DESC);

CREATE TABLE route_trajectory_point (
    id          BIGSERIAL PRIMARY KEY,
    route_id    BIGINT       NOT NULL REFERENCES route(id) ON DELETE CASCADE,
    seq         INT          NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    point_type  VARCHAR(16)  NOT NULL DEFAULT 'ACTUAL',
    recorded_at TIMESTAMPTZ,
    UNIQUE (route_id, seq, point_type)
);

CREATE INDEX idx_trajectory_route ON route_trajectory_point(route_id, point_type, seq);

ALTER TABLE route
    ADD COLUMN origin_lat       DOUBLE PRECISION,
    ADD COLUMN origin_lng       DOUBLE PRECISION,
    ADD COLUMN destination_lat  DOUBLE PRECISION,
    ADD COLUMN destination_lng  DOUBLE PRECISION,
    ADD COLUMN started_at       TIMESTAMPTZ,
    ADD COLUMN completed_at     TIMESTAMPTZ;

CREATE INDEX idx_route_in_transit ON route(status) WHERE status = 'IN_TRANSIT';
