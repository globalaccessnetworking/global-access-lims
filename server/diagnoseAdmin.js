const { User } = require('./models');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const { Op } = require('sequelize');

const diagnose = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Check for Admin Identity
        console.log('--- Searching for Admin User ---');
        const admin = await User.findOne({
            where: {
                [Op.or]: [
                    { username: 'admin' },
                    { email: 'admin@globalaccess.com' }
                ]
            }
        });

        if (!admin) {
            console.error('❌ CRITICAL: Admin user NOT FOUND in database.');
            process.exit(1);
        }

        console.log(`✅ User Found: ID=${admin.id}, Username=${admin.username}, Email=${admin.email}, Role=${admin.role}`);
        console.log(`   Stored Hash: ${admin.password_hash.substring(0, 20)}...`);

        // 2. Test Password
        console.log('--- Testing Password "admin123" ---');
        const isMatch = await bcrypt.compare('admin123', admin.password_hash);

        if (isMatch) {
            console.log('✅ Password Match: "admin123" is correct.');
        } else {
            console.error('❌ Password Mismatch: The stored hash does NOT match "admin123".');

            // Try rehashing to see difference
            const newHash = await bcrypt.hash('admin123', 10);
            console.log(`   New Hash of 'admin123': ${newHash.substring(0, 20)}...`);

            // Attempt Force Fix
            console.log('--- ATTEMPTING FORCE FIX ---');
            admin.password_hash = newHash;
            await admin.save();
            console.log('✅ Admin password forcefully updated to "admin123". Try logging in now.');
        }

    } catch (err) {
        console.error('Diagnostic failed:', err);
    } finally {
        process.exit(0);
    }
};

diagnose();
