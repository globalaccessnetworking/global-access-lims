-- Phase 166: Host Bacteria Registry Initialization
-- This script creates the ext_host_bacteria table to match MS Access high-fidelity requirements.

CREATE TABLE IF NOT EXISTS "ext_host_bacteria" (
    id SERIAL PRIMARY KEY,
    "ID" VARCHAR(50), -- Legacy string ID
    "Host_Bacteria_No" VARCHAR(100) NOT NULL UNIQUE, -- Strain Designation
    "Specie" INTEGER, -- Relational lookup (bacterial_species)
    "Wild_type_Recom" INTEGER, -- Relational lookup (wild_type_recomb_types)
    "Researcher" VARCHAR(100),
    "Date_of_Storage" DATE DEFAULT CURRENT_DATE,
    
    -- Storage Block (Glycerol)
    "Glycerol_Stock_tube_label" VARCHAR(200),
    "GS_Freezer_Number" INTEGER, -- Relational lookup (freezer_locations)
    "GS_Rack_Number" INTEGER, -- Relational lookup (rack_locations)
    "GS_Box_details" INTEGER, -- Relational lookup (box_locations)
    "Location_in_Box_GS" VARCHAR(50),
    
    -- Clinical Observations
    "Notes" TEXT,
    "Picture" TEXT, -- Base64 Microscopy/Colony Image
    
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Register metadata for UI Identity Preservation (Dynamic Engine)
COMMENT ON COLUMN "ext_host_bacteria"."Picture" IS 'type:image';
COMMENT ON COLUMN "ext_host_bacteria"."Specie" IS 'type:select,endpoint:/lookup/species';
COMMENT ON COLUMN "ext_host_bacteria"."Wild_type_Recom" IS 'type:select,endpoint:/lookup/wild-type-recomb';
COMMENT ON COLUMN "ext_host_bacteria"."GS_Freezer_Number" IS 'type:select,endpoint:/lookup/freezers';
COMMENT ON COLUMN "ext_host_bacteria"."GS_Rack_Number" IS 'type:select,endpoint:/lookup/racks';
COMMENT ON COLUMN "ext_host_bacteria"."GS_Box_details" IS 'type:select,endpoint:/lookup/boxes';
