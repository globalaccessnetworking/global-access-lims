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
const experimentsRoutes = require('./routes/experiments');
require('dotenv').config();

const app = express();
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
app.use('/api/sources', require('./routes/sources'));
app.use('/api/modules', require('./routes/modules'));
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
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/import', require('./routes/import'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/templates', require('./routes/templates'));



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
        // Sync models
        // await sequelize.sync();
        // await initialSeed();

        // Initialize backup scheduler
        const { scheduleDailyBackup } = require('./scheduler');
        scheduleDailyBackup();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log('Unable to connect to the database:');
        console.log(error.message);
        process.exit(1);
    }
};

init();
