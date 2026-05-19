const { BiologicalAsset, StorageLocation, AuditLog } = require('../models');

exports.getAssets = async (req, res) => {
    try {
        const { box, type, limit, offset, search } = req.query;
        const { Op } = require('sequelize');

        let queryOptions = {
            include: [{ model: StorageLocation }],
            attributes: { exclude: ['sequence_data', 'image_url', 'morphology', 'characteristics'] },
            where: {}
        };

        // Search Filter (Fuzzy)
        if (search) {
            queryOptions.where[Op.or] = [
                { strain_number: { [Op.iLike]: `%${search}%` } },
                { species: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Filter by Box (via StorageLocation)
        if (box) {
            queryOptions.include[0].where = { box: box };
        }

        // Filter by Type
        if (type) {
            queryOptions.where.type = type;
        }

        // Filter by Strain Number (Exact match shortcut)
        if (req.query.strain_number) {
            queryOptions.where.strain_number = req.query.strain_number;
        }

        // Pagination
        if (limit) queryOptions.limit = parseInt(limit);
        if (offset) queryOptions.offset = parseInt(offset);

        // Sort by ID to ensure stable pagination
        queryOptions.order = [['id', 'ASC']];

        const assets = await BiologicalAsset.findAll(queryOptions);
        res.json(assets);
    } catch (err) {
        console.error("Get Assets Error:", err.message);
        res.status(500).send('Server Error');
    }
};

exports.getBacteriophages = async (req, res) => {
    try {
        const { BiologicalAsset, StorageLocation, PhageHostInteraction } = require('../models');

        const phages = await BiologicalAsset.findAll({
            where: { type: 'Phage' },
            include: [
                { model: StorageLocation },
                // Include Host Interactions to get Host Name
                {
                    model: PhageHostInteraction,
                    as: 'HostInteractions',
                    include: [{ model: BiologicalAsset, as: 'Host', attributes: ['species', 'strain_number'] }]
                }
            ]
        });

        // Map to flat structure for frontend table
        const formatted = phages.map(p => {
            // Extract details from morphology JSON if available
            let details = {};
            if (p.morphology && typeof p.morphology === 'object') {
                details = p.morphology;
            } else if (typeof p.morphology === 'string') {
                try { details = JSON.parse(p.morphology); } catch (e) { }
            }

            // Get Host Name (First interaction or from characteristics)
            let hostName = 'Unknown';
            if (p.HostInteractions && p.HostInteractions.length > 0 && p.HostInteractions[0].Host) {
                hostName = p.HostInteractions[0].Host.species;
            } else if (p.characteristics && p.characteristics.includes('Host:')) {
                // Fallback parsing
                const match = p.characteristics.match(/Host:\s*([^|]+)/);
                if (match) hostName = match[1].trim();
            }

            return {
                id: p.id,
                Phage_ID: p.strain_number, // User refers to 'Phage_ID' but model uses 'strain_number' as unique text ID
                Titer_PFU_mL: details.titer || 'N/A',
                Morphology: details.virion || p.characteristics, // Fallback
                Isolation_Date: details.isolation_date || p.created_at,
                Host: hostName,
                Storage_Location: p.StorageLocation ? `${p.StorageLocation.box} (${p.StorageLocation.position})` : 'Unassigned',
                storage_box: p.StorageLocation?.box,
                storage_pos: p.StorageLocation?.position
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Phage fetch error:", err);
        res.status(500).send("Server Error");
    }
};

exports.addAsset = async (req, res) => {
    const { 
        species, strain_number, type, characteristics, StorageLocation: locationData, 
        source_id, antibiotic_sensitivity, morphology,
        species_id, wild_type_id, stock_category_id, 
        phage_name_id, host_strain_id, lytic_type_id, against_species_id,
        plasmid_vector_id, gene_source_id, cloning_method_id, antibiotic_marker_id,
        target_phage_id, target_plasmid_id,
        manufacturer_id, notes
    } = req.body;
    
    const { Source, AntibioticSensitivity, StorageLocation: StorageModel, PhageHostInteraction, BiologicalAsset: AssetModel } = require('../models');

    try {
        // DUPLICATE GUARD: Check if ID already exists
        const existing = await AssetModel.findOne({ where: { strain_number } });
        if (existing) {
            return res.status(400).json({ msg: `Duplicate Error: ID '${strain_number}' already exists.` });
        }

        // Handle Storage Location
        let storage_location_id = null;
        if (locationData) {
            const [loc] = await StorageModel.findOrCreate({
                where: {
                    freezer_name: locationData.freezer_name || '',
                    box: locationData.box || '',
                    position: locationData.position || '',
                    freezer_id: locationData.freezer_id || null,
                    rack_id: locationData.rack_id || null,
                    box_id: locationData.box_id || null
                }
            });
            storage_location_id = loc.id;
        }

        const newAsset = await AssetModel.create({
            species,
            strain_number,
            type: type || 'Strain',
            characteristics,
            storage_location_id,
            source_id: source_id || null,
            species_id: species_id || null,
            wild_type_id: wild_type_id || null,
            stock_category_id: stock_category_id || null,
            phage_name_id: phage_name_id || null,
            host_strain_id: host_strain_id || null,
            lytic_type_id: lytic_type_id || null,
            against_species_id: against_species_id || null,
            plasmid_vector_id: plasmid_vector_id || null,
            gene_source_id: gene_source_id || null,
            cloning_method_id: cloning_method_id || null,
            antibiotic_marker_id: antibiotic_marker_id || null,
            target_phage_id: target_phage_id || null,
            target_plasmid_id: target_plasmid_id || null,
            manufacturer_id: manufacturer_id || null,
            morphology: morphology || null,
            notes: notes || null,
            source: 'Manual Entry'
        });

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: 'ADD_ASSET',
            description: `Added new ${type} ${strain_number}`
        });

        res.status(201).json(newAsset);
    } catch (err) {
        console.error('addAsset Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.moveAsset = async (req, res) => {
    const { id } = req.params;
    const { storage_location_id } = req.body;

    try {
        const asset = await BiologicalAsset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const oldLocation = asset.storage_location_id;
        asset.storage_location_id = storage_location_id;
        await asset.save();

        // Audit Log
        await AuditLog.create({
            user_id: req.user.id,
            action: 'MOVE_ASSET',
            description: `Moved asset ${asset.strain_number} from ${oldLocation} to ${storage_location_id}`
        });

        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getDuplicatePrimers = async (req, res) => {
    try {
        const assets = await BiologicalAsset.findAll({
            where: { type: 'Primer' }
        });

        // Client-side grouping for simplicity since we want to return full objects
        // In a very large DB, we'd use GROUP BY in SQL, but for LIMS size this is fine
        const map = new Map();
        assets.forEach(a => {
            if (!map.has(a.species)) map.set(a.species, []);
            map.get(a.species).push(a);
        });

        const duplicates = [];
        map.forEach((group, key) => {
            if (group.length > 1) {
                duplicates.push({ name: key, count: group.length, items: group });
            }
        });

        res.json(duplicates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
