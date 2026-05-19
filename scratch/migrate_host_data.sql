-- Phase 166: Legacy Data Migration for Host Bacteria
-- Inserting 8 records from MS Access source of truth.

INSERT INTO "ext_host_bacteria" ("ID", "Host_Bacteria_No") VALUES
('1', 'Top-10'),
('2', 'DH5-Alpha'),
('3', 'BL-21'),
('4', 'Lemo-cells'),
('5', 'SG-18'),
('6', 'SGPC'),
('7', 'SG-18-D-SSAU'),
('8', 'SG-18-D-SSAU-SPVB')
ON CONFLICT ("Host_Bacteria_No") DO NOTHING;
