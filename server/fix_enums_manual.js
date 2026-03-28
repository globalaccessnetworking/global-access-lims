const sequelize = require('./config/database');

async function fixEnumsManually() {
    try {
        console.log('Adding missing roles to ENUM...');
        // Postgres doesn't allow adding values inside a transaction if it's used elsewhere,
        // so we run these as separate commands.
        try { await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE IF NOT EXISTS 'SuperAdmin'"); } catch (e) { console.log('SuperAdmin likely exists or error:', e.message); }
        try { await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE IF NOT EXISTS 'Researcher'"); } catch (e) { console.log('Researcher likely exists or error:', e.message); }
        try { await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE IF NOT EXISTS 'Student'"); } catch (e) { console.log('Student likely exists or error:', e.message); }

        console.log('Roles updated successfully.');

        const [results] = await sequelize.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'enum_Users_role'");
        console.log('FINAL ROLES IN DB:', results.map(r => r.enumlabel).join(', '));

    } catch (err) {
        console.error('Error fixing enums:', err);
    } finally {
        await sequelize.close();
    }
}

fixEnumsManually();
