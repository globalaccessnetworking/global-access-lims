const { sequelize } = require('./models');

async function testDescribe() {
    const tableNames = ['ext_lab_projects', '"ext_lab_projects"', 'EXT_LAB_PROJECTS'];
    for (const name of tableNames) {
        try {
            const description = await sequelize.getQueryInterface().describeTable(name);
            console.log(`- ${name}: SUCCESS (${Object.keys(description).length} columns)`);
        } catch (err) {
            console.log(`- ${name}: FAILED (${err.message})`);
        }
    }
    process.exit(0);
}

testDescribe();
