-- V8: Seed geo coordinates and sample trajectory for the live map demo

UPDATE route SET
    origin_lat = 33.5731, origin_lng = -7.5898,
    destination_lat = 35.7595, destination_lng = -5.8340,
    last_known_lat = 34.2610, last_known_lng = -6.5802,
    started_at = now() - interval '2 hours',
    updated_at = now()
WHERE id = 1;

UPDATE route SET
    origin_lat = 33.5731, origin_lng = -7.5898,
    destination_lat = 41.3851, destination_lng = 2.1734
WHERE id = 2;

-- Idempotent re-run: clear demo seed rows before inserting (safe for route 1 demo data only).
DELETE FROM truck_location WHERE route_id = 1;
DELETE FROM route_trajectory_point WHERE route_id = 1;

INSERT INTO route_trajectory_point (route_id, seq, latitude, longitude, point_type, recorded_at) VALUES
    (1, 1, 33.5731, -7.5898, 'PLANNED', NULL),
    (1, 2, 34.0209, -6.8416, 'PLANNED', NULL),
    (1, 3, 34.6866, -6.3160, 'PLANNED', NULL),
    (1, 4, 35.7595, -5.8340, 'PLANNED', NULL),
    (1, 1, 33.5731, -7.5898, 'ACTUAL', now() - interval '120 minutes'),
    (1, 2, 33.8500, -7.2000, 'ACTUAL', now() - interval '90 minutes'),
    (1, 3, 34.1000, -6.9000, 'ACTUAL', now() - interval '60 minutes'),
    (1, 4, 34.2610, -6.5802, 'ACTUAL', now() - interval '5 minutes');

INSERT INTO truck_location (route_id, truck_id, latitude, longitude, speed_kmh, heading_deg, recorded_at, source) VALUES
    (1, 2, 33.5731, -7.5898, 0,   45, now() - interval '120 minutes', 'GPS'),
    (1, 2, 33.8500, -7.2000, 82,  30, now() - interval '90 minutes',  'GPS'),
    (1, 2, 34.1000, -6.9000, 78,  25, now() - interval '60 minutes',  'GPS'),
    (1, 2, 34.2610, -6.5802, 75,  20, now() - interval '5 minutes',   'GPS');
