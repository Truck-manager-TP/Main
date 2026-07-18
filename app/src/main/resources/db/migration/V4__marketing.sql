-- V4: Marketing & Growth schema
CREATE TABLE lead (
    id           BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(128) NOT NULL,
    contact_name VARCHAR(128) NOT NULL,
    email        VARCHAR(128) NOT NULL,
    channel      VARCHAR(64)  NOT NULL,
    stage        VARCHAR(32)  NOT NULL DEFAULT 'NEW',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_stage ON lead(stage);
