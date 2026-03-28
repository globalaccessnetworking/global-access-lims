-- Protocol tables for workflow engine
CREATE TABLE IF NOT EXISTS protocols (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    estimated_time INTEGER, -- in minutes
    steps JSONB NOT NULL, -- Array of step objects
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_executions (
    id SERIAL PRIMARY KEY,
    protocol_id INTEGER REFERENCES protocols(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    experiment_id INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, paused, cancelled
    current_step INTEGER DEFAULT 0,
    step_data JSONB DEFAULT '{}', -- Store step-specific data (timers, calculations, etc.)
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_protocol_executions_user ON protocol_executions(user_id);
CREATE INDEX idx_protocol_executions_status ON protocol_executions(status);

-- Insert sample protocols
INSERT INTO protocols (name, description, category, estimated_time, steps) VALUES
('DNA Extraction', 'Standard genomic DNA extraction protocol', 'Molecular Biology', 120, '[
    {
        "id": 1,
        "title": "Sample Preparation",
        "description": "Prepare bacterial culture sample",
        "type": "instruction",
        "duration": 10,
        "instructions": ["Centrifuge 1.5ml of overnight culture at 10,000 rpm for 2 minutes", "Discard supernatant", "Resuspend pellet in 200µl PBS"]
    },
    {
        "id": 2,
        "title": "Cell Lysis",
        "description": "Lyse bacterial cells",
        "type": "timed",
        "duration": 15,
        "instructions": ["Add 200µl lysis buffer", "Incubate at 65°C for 15 minutes"],
        "timer": 15,
        "reminder": "Check temperature is at 65°C"
    },
    {
        "id": 3,
        "title": "Protein Precipitation",
        "description": "Remove proteins from sample",
        "type": "instruction",
        "duration": 5,
        "instructions": ["Add 100µl protein precipitation solution", "Vortex vigorously for 20 seconds", "Centrifuge at 13,000 rpm for 3 minutes"]
    },
    {
        "id": 4,
        "title": "DNA Precipitation",
        "description": "Precipitate DNA with isopropanol",
        "type": "calculation",
        "duration": 20,
        "instructions": ["Transfer supernatant to new tube", "Add {volume}µl isopropanol", "Mix gently by inversion", "Incubate at room temperature for 5 minutes"],
        "calculation": {
            "formula": "volume * 0.6",
            "inputs": ["volume"],
            "output": "volume"
        }
    },
    {
        "id": 5,
        "title": "DNA Washing",
        "description": "Wash DNA pellet",
        "type": "instruction",
        "duration": 10,
        "instructions": ["Centrifuge at 13,000 rpm for 1 minute", "Carefully remove supernatant", "Add 500µl 70% ethanol", "Centrifuge at 13,000 rpm for 1 minute", "Remove ethanol and air dry for 5 minutes"]
    },
    {
        "id": 6,
        "title": "DNA Resuspension",
        "description": "Resuspend DNA in TE buffer",
        "type": "instruction",
        "duration": 5,
        "instructions": ["Add 50µl TE buffer", "Incubate at 65°C for 1 hour or 4°C overnight", "Store at -20°C"]
    }
]'::jsonb),

('PCR Amplification', 'Standard PCR protocol for gene amplification', 'Molecular Biology', 180, '[
    {
        "id": 1,
        "title": "Reaction Setup",
        "description": "Prepare PCR master mix",
        "type": "calculation",
        "duration": 15,
        "instructions": ["Add {water}µl nuclease-free water", "Add {buffer}µl 10X PCR buffer", "Add {dNTPs}µl dNTP mix (10mM each)", "Add {primer_f}µl forward primer (10µM)", "Add {primer_r}µl reverse primer (10µM)", "Add {polymerase}µl Taq polymerase", "Add {template}µl DNA template"],
        "calculation": {
            "formula": "reactions * component_volume",
            "inputs": ["reactions"],
            "outputs": {
                "water": 34.5,
                "buffer": 5,
                "dNTPs": 1,
                "primer_f": 2,
                "primer_r": 2,
                "polymerase": 0.5,
                "template": 5
            }
        }
    },
    {
        "id": 2,
        "title": "Initial Denaturation",
        "description": "Set up thermocycler",
        "type": "timed",
        "duration": 5,
        "instructions": ["Place tubes in thermocycler", "Run: 95°C for 5 minutes"],
        "timer": 5,
        "reminder": "Ensure lid is heated to 105°C"
    },
    {
        "id": 3,
        "title": "Cycling",
        "description": "PCR amplification cycles",
        "type": "instruction",
        "duration": 120,
        "instructions": ["30 cycles of:", "  - 95°C for 30 seconds (denaturation)", "  - 55°C for 30 seconds (annealing)", "  - 72°C for 1 minute (extension)"]
    },
    {
        "id": 4,
        "title": "Final Extension",
        "description": "Complete synthesis",
        "type": "timed",
        "duration": 10,
        "instructions": ["72°C for 10 minutes", "Hold at 4°C"],
        "timer": 10
    },
    {
        "id": 5,
        "title": "Verification",
        "description": "Check PCR product",
        "type": "instruction",
        "duration": 30,
        "instructions": ["Run 5µl on 1% agarose gel", "Check for band at expected size", "Store remaining product at -20°C"]
    }
]'::jsonb),

('Bacterial Transformation', 'Heat shock transformation of competent cells', 'Microbiology', 90, '[
    {
        "id": 1,
        "title": "Thaw Competent Cells",
        "description": "Prepare competent cells on ice",
        "type": "timed",
        "duration": 10,
        "instructions": ["Remove competent cells from -80°C", "Thaw on ice for 10 minutes"],
        "timer": 10,
        "reminder": "Keep cells on ice at all times"
    },
    {
        "id": 2,
        "title": "Add DNA",
        "description": "Mix plasmid with cells",
        "type": "calculation",
        "duration": 5,
        "instructions": ["Add {dna_volume}µl plasmid DNA (10-100ng)", "Mix gently by flicking tube", "Incubate on ice for 30 minutes"],
        "calculation": {
            "formula": "dna_concentration / target_ng",
            "inputs": ["dna_concentration", "target_ng"],
            "output": "dna_volume"
        }
    },
    {
        "id": 3,
        "title": "Heat Shock",
        "description": "Heat shock transformation",
        "type": "timed",
        "duration": 2,
        "instructions": ["Place tube in 42°C water bath", "Incubate for exactly 90 seconds", "Immediately transfer to ice for 2 minutes"],
        "timer": 2,
        "reminder": "Timing is critical - use timer!"
    },
    {
        "id": 4,
        "title": "Recovery",
        "description": "Allow cells to recover",
        "type": "timed",
        "duration": 60,
        "instructions": ["Add 900µl SOC medium", "Incubate at 37°C with shaking (200 rpm) for 60 minutes"],
        "timer": 60
    },
    {
        "id": 5,
        "title": "Plating",
        "description": "Plate transformed cells",
        "type": "instruction",
        "duration": 10,
        "instructions": ["Spread 100µl on LB + antibiotic plate", "Spread 10µl on second plate (dilution)", "Incubate plates inverted at 37°C overnight"]
    }
]'::jsonb);
