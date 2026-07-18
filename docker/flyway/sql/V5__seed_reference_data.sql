-- V5: Seed reference data so DEV/UAT come up with a usable dataset.
INSERT INTO truck (registration_plate, make, model, classification, status, capacity_tons)
VALUES
    ('1234-A-56', 'Volvo',    'FH16',   'REFRIGERATED', 'AVAILABLE', 24.0),
    ('7788-B-12', 'Renault',  'T High', 'GENERAL_CARGO','ON_ROUTE',  18.5),
    ('4455-C-09', 'Mercedes', 'Actros', 'HAZMAT',       'MAINTENANCE',26.0);

INSERT INTO driver (full_name, license_number, type, availability, license_expiry, passport_expiry, international_permit_expiry)
VALUES
    ('Youssef El Amrani', 'DL-MA-1001', 'INTERNATIONAL', 'AVAILABLE', DATE '2030-06-30', DATE '2031-01-15', DATE '2029-12-31'),
    ('Fatima Zahra Bennani','DL-MA-1002','DOMESTIC',     'ON_DUTY',   DATE '2029-03-20', NULL, NULL);

INSERT INTO route (origin, destination, scope, truck_id, driver_id, status, distance_km)
VALUES
    ('Casablanca', 'Tanger',    'DOMESTIC',      2, 2, 'IN_TRANSIT', 340.0),
    ('Casablanca', 'Barcelona', 'INTERNATIONAL', 1, 1, 'PLANNED',    1120.0);

INSERT INTO lead (company_name, contact_name, email, channel, stage)
VALUES
    ('Atlas Distribution', 'Karim Idrissi', 'karim@atlas-dist.ma', 'WEBSITE',  'QUALIFIED'),
    ('MedFresh Exports',   'Sara Alaoui',   'sara@medfresh.ma',    'REFERRAL', 'ONBOARDING');
