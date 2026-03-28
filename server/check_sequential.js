const { sequelize, BiologicalAsset, StorageLocation } = require('./models');

async function check() {
    try {
        const ba = await BiologicalAsset.findOne({
            where: { type: 'Phage' },
            order: [['id', 'ASC']],
            include: [StorageLocation]
        });
        const [ext] = await sequelize.query('SELECT * FROM "ext_bacteriophages" ORDER BY id ASC LIMIT 1');

        console.log("CENTRAL PHAGE (First):", {
            ba_id: ba.id,
            ba_label: ba.strain_number,
            ba_loc: ba.StorageLocation ? { box: ba.StorageLocation.box, pos: ba.StorageLocation.position } : null
        });

        console.log("EXT PHAGE (First):", {
            ext_id: ext[0].id,
            ext_name: ext[0].Bacteriophage_Name,
            ext_loc: { box: ext[0].GS_Box_details, pos: ext[0].GS_position_in_Box }
        });

        const baLast = await BiologicalAsset.findOne({
            where: { type: 'Phage' },
            order: [['id', 'DESC']],
            include: [StorageLocation]
        });
        const [extLast] = await sequelize.query('SELECT * FROM "ext_bacteriophages" ORDER BY id DESC LIMIT 1');

        console.log("CENTRAL PHAGE (Last):", {
            ba_id: baLast.id,
            ba_label: baLast.strain_number,
            ba_loc: baLast.StorageLocation ? { box: baLast.StorageLocation.box, pos: baLast.StorageLocation.position } : null
        });

        console.log("EXT PHAGE (Last):", {
            ext_id: extLast[0].id,
            ext_name: extLast[0].Bacteriophage_Name,
            ext_loc: { box: extLast[0].GS_Box_details, pos: extLast[0].GS_position_in_Box }
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
