const { sequelize, CustomForm, SystemAuditLog, BiologicalAsset } = require('./models');
const { QueryTypes } = require('sequelize');

async function testDetailFetch() {
    try {
        console.log("--- STARTING API LOGIC TEST ---");
        const type = 'PRIMER';
        const id = '1241'; // An ID from the user screenshot

        const tableMap = {
            'PHAGE': 'ext_bacteriophages',
            'STRAIN': 'ext_bacterial_strains',
            'PRIMER': 'ext_primers_details',
            'PLASMID': 'ext_plasmids'
        };

        const targetTable = tableMap[type.toUpperCase()];
        console.log("Target Table:", targetTable);

        // 1. Fetch raw record
        const record = await sequelize.query(
            `SELECT * FROM "${targetTable}" WHERE "id" = :id`,
            { replacements: { id }, type: QueryTypes.SELECT, plain: true }
        );

        console.log("Record Found:", record ? "YES" : "NO");
        if (record) {
            console.log("Record ID:", record.id);
            console.log("Record Name:", record.Primer_Name || record.Bacteriophage_Name || record.Strain_No);
        }

        // 2. Resolve Schema
        const schema = await CustomForm.findOne({
            where: { table_name: targetTable, status: 'Published' }
        });

        console.log("Schema Found:", schema ? "YES" : "NO");
        if (schema) {
            console.log("Schema Title:", schema.title);
        }

        console.log("--- TEST COMPLETED SUCCESS ---");
    } catch (err) {
        console.error("--- TEST FAILED ---");
        console.error(err);
    } finally {
        process.exit();
    }
}

testDetailFetch();
