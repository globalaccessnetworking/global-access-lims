const { sequelize } = require('./models');
const { Sequelize } = require('sequelize');

async function testPutRoute() {
    try {
        const tableName = 'ext_plasmids';
        const id = '552';
        const payload = {
            Plasmid_Name: 'test',
            Plasmid_Backbone: '1',
            Gene_Source: '1',
            Cloning_Method: '1',
            Antibiotic_Marker: '1',
            Host_Bacteria: '2',
            Activity_Shown_Against: '11',
            Glycerol_Stock_Tube_Label: 'testlabel',
            GLycerol_Stock_Freezer: '1',
            Glycerol_Stock_Rack: '22',
            Glycerol_Stock_Box: '101',
            Location_in_Box_GS: 'O9',
            PLasmid_DNA_Label: 'testlabel',
            DNA_Store_Freezer: '1',
            DNA_Store_Rack: '22',
            DNA_Store_Box_Detail: '101',
            Protein_Purification_status: 'No'
        };

        const description = await sequelize.getQueryInterface().describeTable(tableName);

        let pkColName = null;
        if (description['id'] && description['id'].primaryKey) pkColName = 'id';
        else if (description['ID'] && description['ID'].primaryKey) pkColName = 'ID';
        else if (description['id']) pkColName = 'id';
        else if (description['ID']) pkColName = 'ID';

        if (pkColName) {
            delete payload[pkColName];
        }

        const updates = Object.keys(payload).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = Object.values(payload);

        const query = `UPDATE "${tableName}" SET ${updates} WHERE "${pkColName || 'id'}" = $${values.length + 1} RETURNING *`;
        console.log('Generated UPDATE SQL:', query);
        console.log('Values:', values);

        const result = await sequelize.query(query, {
            bind: [...values, id],
            type: Sequelize.QueryTypes.UPDATE
        });

        console.log('UPDATE Result:', result);
    } catch (e) {
        console.error('PUT Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

testPutRoute();
