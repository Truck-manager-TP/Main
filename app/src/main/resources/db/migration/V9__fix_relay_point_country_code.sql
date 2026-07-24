-- V9: Align relay_point.country_code with JPA VARCHAR(2) mapping (was CHAR(2)).
ALTER TABLE relay_point
    ALTER COLUMN country_code TYPE VARCHAR(2);
