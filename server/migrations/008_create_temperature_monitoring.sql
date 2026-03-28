-- Migration: Create temperature monitoring tables
-- Date: 2026-02-16
-- Feature: Temperature Monitoring

CREATE TABLE IF NOT EXISTS temperature_sensors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    sensor_type VARCHAR(50), -- 'freezer', 'fridge', 'incubator'
    min_temp DECIMAL(5,2),
    max_temp DECIMAL(5,2),
    api_endpoint VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES temperature_sensors(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_alerts (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES temperature_sensors(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'high', 'low', 'offline'
    temperature DECIMAL(5,2),
    message TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_sensor ON temperature_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_readings_time ON temperature_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor ON temperature_alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON temperature_alerts(acknowledged);

COMMENT ON TABLE temperature_sensors IS 'IoT temperature sensor registry';
COMMENT ON TABLE temperature_readings IS 'Historical temperature data';
COMMENT ON TABLE temperature_alerts IS 'Temperature threshold violations';
