const { sequelize } = require('./models');

async function seed() {
    try {
        await sequelize.authenticate();

        // 1. Delete existing project to start fresh
        await sequelize.query("DELETE FROM ext_lab_projects WHERE name = 'LIMS Optimization'");

        // 2. Insert project with all required fields
        await sequelize.query(`
            INSERT INTO ext_lab_projects (name, description, status, start_date, end_date, lead_investigator_id, color_code)
            VALUES ('LIMS Optimization', 'Project to enhance the laboratory information management system', 'Active', '2026-02-01', '2026-03-01', 114, '#3b82f6')
        `);

        const [newProjects] = await sequelize.query("SELECT id FROM ext_lab_projects WHERE name = 'LIMS Optimization' LIMIT 1");
        const projectId = newProjects[0].id;

        // 3. Clear old test tasks if any
        await sequelize.query("DELETE FROM ext_lab_tasks WHERE title IN ('Verify LIMS Integration', 'Implement Dashboard Widget', 'Past Deadline Task')");

        // 4. Create a Task assigned to admin (114)
        await sequelize.query(`
            INSERT INTO ext_lab_tasks (title, description, status, priority, due_date, project_id, assigned_to_id)
            VALUES ('Implement Dashboard Widget', 'Develop the My Tasks widget for the main dashboard', 'Pending', 'High', '2026-02-28', :projectId, 114)
        `, { replacements: { projectId } });

        // 4. Create an Overdue Task for testing alerts
        await sequelize.query(`
            INSERT INTO ext_lab_tasks (title, description, status, priority, due_date, project_id, assigned_to_id)
            VALUES ('Past Deadline Task', 'This task should appear in the alert center', 'Pending', 'Critical', '2026-02-10', :projectId, 114)
        `, { replacements: { projectId } });

        console.log('✅ Seed data created successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
