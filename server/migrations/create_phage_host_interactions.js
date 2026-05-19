/**
 * Phase 175 — Safe Migration: Create ext_phage_host_interactions
 * 
 * SAFETY GUARANTEES:
 * - Uses CREATE TABLE IF NOT EXISTS — runs zero risk if table already exists.
 * - Scoped strictly to the 'public' schema of the Bacteriophage LIMS database.
 * - Does NOT touch any other tables, schemas, or databases.
 * - Uses TEXT for result (not ENUM) — future-proof, no ALTER TABLE needed.
 * - UNIQUE constraint on (phage_id, strain_id) prevents duplicate entries.
 */

const runMigration = async (sequelize) => {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "ext_phage_host_interactions" (
                "id"          SERIAL PRIMARY KEY,
                "phage_id"    INTEGER NOT NULL,
                "strain_id"   INTEGER NOT NULL,
                "result"      TEXT NOT NULL DEFAULT '-',
                "tested_by"   TEXT,
                "date_tested" DATE DEFAULT CURRENT_DATE,
                "notes"       TEXT,
                "created_at"  TIMESTAMP DEFAULT NOW(),
                "updated_at"  TIMESTAMP DEFAULT NOW()
            );
        `);

        // Phase 180: Add UNIQUE constraint idempotently — safe even if table already exists.
        // This is required for ON CONFLICT (phage_id, strain_id) to work in PostgreSQL.
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'ext_phage_host_interactions_phage_id_strain_id_key'
                      AND conrelid = 'ext_phage_host_interactions'::regclass
                ) THEN
                    ALTER TABLE ext_phage_host_interactions
                    ADD CONSTRAINT ext_phage_host_interactions_phage_id_strain_id_key
                    UNIQUE (phage_id, strain_id);
                    RAISE NOTICE '[PHASE 180] UNIQUE constraint added.';
                ELSE
                    RAISE NOTICE '[PHASE 180] UNIQUE constraint already exists.';
                END IF;
            END$$;
        `);


        // Create index for fast lookups on phage_id (most common query pattern)
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_phi_phage_id ON "ext_phage_host_interactions" ("phage_id");
        `);

        // Create index for fast lookups on strain_id
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_phi_strain_id ON "ext_phage_host_interactions" ("strain_id");
        `);

        console.log('[PHASE 175] ✅ Migration OK: ext_phage_host_interactions is ready.');
    } catch (err) {
        // Non-fatal — server still starts even if migration fails
        console.error('[PHASE 175] ⚠️  Migration warning (non-fatal):', err.message);
    }
};

module.exports = { runMigration };
