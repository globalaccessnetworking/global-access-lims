-- Migration: Create equipment_bookings table
-- Date: 2026-02-16
-- Feature: Equipment Booking System

CREATE TABLE IF NOT EXISTS equipment_bookings (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES ext_equipment_logs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON equipment_bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON equipment_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON equipment_bookings(user_id);

COMMENT ON TABLE equipment_bookings IS 'Equipment reservation system to prevent scheduling conflicts';
