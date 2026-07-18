-- V1: Fleet & Expense Management schema
CREATE TABLE truck (
    id                 BIGSERIAL PRIMARY KEY,
    registration_plate VARCHAR(32)  NOT NULL UNIQUE,
    make               VARCHAR(64)  NOT NULL,
    model              VARCHAR(64)  NOT NULL,
    classification     VARCHAR(32)  NOT NULL,
    status             VARCHAR(32)  NOT NULL DEFAULT 'AVAILABLE',
    capacity_tons      DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE expense (
    id          BIGSERIAL PRIMARY KEY,
    truck_id    BIGINT        NOT NULL REFERENCES truck(id) ON DELETE CASCADE,
    type        VARCHAR(32)   NOT NULL,
    amount_mad  NUMERIC(12,2) NOT NULL CHECK (amount_mad >= 0),
    incurred_on DATE          NOT NULL,
    notes       VARCHAR(500)
);

CREATE INDEX idx_expense_truck ON expense(truck_id);
CREATE INDEX idx_truck_status  ON truck(status);
