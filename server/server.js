const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const auditRoutes = require('./routes/audit');
const antibioticRoutes = require('./routes/antibiotics');
const interactionsRoutes = require('./routes/interactions');
const { runMigration } = require('./migrations/create_phage_host_interactions');
const experimentsRoutes = require('./routes/experiments');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();

// Heartbeat Debugger
app.use((req, res, next) => {
    try {
        const logPath = 'C:\\Users\\Global Access\\.gemini\\antigravity\\scratch\\server_heartbeat.log';
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${req.method} ${req.url}\n`);
    } catch (e) {}
    next();
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.send('Bacteriophage LIMS API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/antibiotics', antibioticRoutes);
app.use('/api/experiments', experimentsRoutes);
app.use('/api/interactions', interactionsRoutes);

// Phase 181: Debug route — always available, confirms table state
app.get('/api/interactions/debug', async (req, res) => {
    try {
        const { sequelize } = require('./models');
        const { QueryTypes } = require('sequelize');

        // Check table exists
        const tableCheck = await sequelize.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'ext_phage_host_interactions'
            ) AS exists`,
            { type: QueryTypes.SELECT }
        );

        const tableExists = tableCheck[0]?.exists === true;

        let rowCount = 0;
        let constraintExists = false;
        let sampleRows = [];

        if (tableExists) {
            const [countRow] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM ext_phage_host_interactions`,
                { type: QueryTypes.SELECT }
            );
            rowCount = Number(countRow.total);

            const [constRow] = await sequelize.query(
                `SELECT COUNT(*) AS cnt FROM pg_constraint
                 WHERE conname = 'ext_phage_host_interactions_phage_id_strain_id_key'`,
                { type: QueryTypes.SELECT }
            );
            constraintExists = Number(constRow.cnt) > 0;

            sampleRows = await sequelize.query(
                `SELECT * FROM ext_phage_host_interactions LIMIT 5`,
                { type: QueryTypes.SELECT }
            );
        }

        res.json({
            table_exists: tableExists,
            row_count: rowCount,
            unique_constraint_exists: constraintExists,
            sample_rows: sampleRows,
            message: tableExists
                ? `Table exists with ${rowCount} row(s). Constraint: ${constraintExists ? 'YES' : 'MISSING'}`
                : 'TABLE DOES NOT EXIST — this is the root cause of all failures'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.use('/api/sources', require('./routes/sources'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/lookup', require('./routes/lookup'));
app.use('/api/system', require('./routes/system'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/analytics', require('./routes/analytics'));

// New Core Modules
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/search', require('./routes/search'));
app.use('/api/phage-matrix', require('./routes/phageMatrix'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/batch', require('./routes/batch'));
app.use('/api/filters', require('./routes/filters'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/protocols', require('./routes/protocols'));
app.use('/api/bio', require('./routes/bio'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/scan', require('./routes/scan'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/import', require('./routes/import'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/metadata', require('./routes/metadata'));
app.use('/api/forms', require('./routes/forms'));



// Global Audit Middleware (Intercepts POST, PUT, DELETE)
app.use(async (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        try {
            const { SystemAuditLog } = require('./models');
            const jwt = require('jsonwebtoken');
            const token = req.header('Authorization')?.replace('Bearer ', '');
            let userId = null;

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_placeholder');
                    userId = decoded.id;
                } catch (e) { /* Warning: Token invalid */ }
            }

            const parts = req.url.split('/'); // /api/inventory/123
            const tableName = parts[2] || 'general';
            const recordId = parts[3] ? parts[3].split('?')[0] : null;

            await SystemAuditLog.create({
                user_id: userId,
                action: req.method,
                table_name: tableName,
                record_id: recordId,
                details: req.body
            });
        } catch (err) {
            console.error('Audit Middleware Error:', err.message);
        }
    }
    next();
});

const initialSeed = async () => {
    try {
        const { User } = require('./models');
        const bcrypt = require('bcryptjs');

        // FORCE DELETE EXISTING ADMIN
        await User.destroy({ where: { email: 'admin@globalaccess.com' } });
        await User.destroy({ where: { username: 'admin' } });

        console.log('Creating Master Admin...');
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        await User.create({
            username: 'admin',
            email: 'admin@globalaccess.com',
            password_hash: hashedPassword,
            role: 'Admin',
            permissions: { library: 'write', inventory: 'write', storage: 'write', entry: 'write' }
        });

        console.log('✅ MASTER ADMIN CREATED: admin / admin123');

    } catch (err) {
        console.error('Seeding failed:', err.message);
    }
};

// Start Server
const init = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection OK!');

        // ── Phase 181: FORCED, VERBOSE Table Creation ─────────────────────────
        // This runs BEFORE the passive migration and crashes loudly if it fails.
        console.log('[PHASE 181] ⚙️  Ensuring ext_phage_host_interactions table...');
        try {
            const { QueryTypes } = require('sequelize');

            // Step 1: Create table (safe if already exists)
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS ext_phage_host_interactions (
                    id          SERIAL PRIMARY KEY,
                    phage_id    INTEGER NOT NULL,
                    strain_id   INTEGER NOT NULL,
                    result      TEXT NOT NULL DEFAULT '-',
                    tested_by   TEXT,
                    date_tested DATE DEFAULT CURRENT_DATE,
                    notes       TEXT,
                    created_at  TIMESTAMP DEFAULT NOW(),
                    updated_at  TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('[PHASE 181] ✅ Table exists or was created.');

            // Step 2: Add UNIQUE constraint idempotently
            await sequelize.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'ext_phage_host_interactions_phage_id_strain_id_key'
                    ) THEN
                        ALTER TABLE ext_phage_host_interactions
                        ADD CONSTRAINT ext_phage_host_interactions_phage_id_strain_id_key
                        UNIQUE (phage_id, strain_id);
                        RAISE NOTICE 'UNIQUE constraint added';
                    END IF;
                END$$
            `);
            console.log('[PHASE 181] ✅ UNIQUE constraint confirmed.');

            // Step 3: Verify with a real COUNT query
            const [countRow] = await sequelize.query(
                'SELECT COUNT(*) AS total FROM ext_phage_host_interactions',
                { type: QueryTypes.SELECT }
            );
            console.log(`[PHASE 181] ✅ Table is operational. Current rows: ${countRow.total}`);

        } catch (tableErr) {
            console.error('[PHASE 181] 🔴 FATAL: Table setup FAILED:', tableErr.message);
            console.error('[PHASE 181] 🔴 Server will start but matrix saves WILL fail until this is resolved.');
        }
        // ─────────────────────────────────────────────────────────────────────

        // Phase 175: passive migration (now redundant but kept for safety)
        await runMigration(sequelize);

        // Initialize backup scheduler
        const { scheduleDailyBackup } = require('./scheduler');
        scheduleDailyBackup();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`[PHASE 181] 🔬 Matrix debug: http://localhost:${PORT}/api/interactions/debug`);
        });
    } catch (error) {
        console.log('Unable to connect to the database:');
        console.log(error.message);
        process.exit(1);
    }
};

init();
