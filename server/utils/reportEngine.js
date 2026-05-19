const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

/**
 * [REPORT ARCHITECT ENGINE] - Clinical Data Extraction v1.0
 * 
 * Safe Dynamic SQL Generator for Multi-Join Research Queries.
 * Provides parameterized execution and whitelist validation.
 */

const ALLOWED_TABLES = [
    'BiologicalAssets', 'InventoryStocks', 'StorageLocations', 'Experiments', 'AvailableAntibiotics',
    'ext_host_bacteria', 'ext_bacterial_strains', 'ext_bacteriophages', 'ext_plasmids', 'ext_primers_details',
    'bacterial_species', 'phage_names', 'manufacturers', 'sources', 'CustomForms'
];

const OPERATORS = {
    '=': '=',
    '!=': '!=',
    '>': '>',
    '<': '<',
    '>=': '>=',
    '<=': '<=',
    'LIKE': 'LIKE',
    'ILIKE': 'ILIKE',
    'IN': 'IN',
    'NOT IN': 'NOT IN'
};

/**
 * Validates table and column names to prevent SQL injection.
 */
const sanitizeIdentifier = (name) => {
    if (!name) return null;
    return name.replace(/[^a-z0-9_]/gi, '');
};

/**
 * Builds the WHERE clause recursively for AND/OR logic.
 */
const buildWhereClause = (filterGroup, replacements) => {
    if (!filterGroup || !filterGroup.conditions || filterGroup.conditions.length === 0) return '';

    const logic = filterGroup.logic === 'OR' ? ' OR ' : ' AND ';
    const conditionsStr = filterGroup.conditions.map((cond, idx) => {
        if (cond.conditions) {
            // Nested Group
            return `(${buildWhereClause(cond, replacements)})`;
        }

        const col = sanitizeIdentifier(cond.column);
        const op = OPERATORS[cond.operator] || '=';
        const key = `val_${Math.random().toString(36).substr(2, 9)}`;
        
        replacements[key] = cond.operator === 'LIKE' || cond.operator === 'ILIKE' ? `%${cond.value}%` : cond.value;

        return `"${col}" ${op} :${key}`;
    }).filter(c => c !== '').join(logic);

    return conditionsStr;
};

/**
 * Primary Execution Engine
 */
const executeComplexQuery = async (config) => {
    const { primaryTable, joins, filters, limit = 1000 } = config;

    if (!ALLOWED_TABLES.includes(primaryTable)) {
        throw new Error(`Forbidden Table Access: ${primaryTable}`);
    }

    let sql = `SELECT * FROM "${sanitizeIdentifier(primaryTable)}"`;
    const replacements = {};

    // 1. Build Joins
    if (joins && Array.isArray(joins)) {
        joins.forEach(join => {
            const secondaryTable = sanitizeIdentifier(join.table);
            if (!ALLOWED_TABLES.includes(secondaryTable)) return;

            const on = sanitizeIdentifier(join.on);
            const ref = sanitizeIdentifier(join.ref);
            sql += ` LEFT JOIN "${secondaryTable}" ON "${sanitizeIdentifier(primaryTable)}"."${on}" = "${secondaryTable}"."${ref}"`;
        });
    }

    // 2. Build Where
    const where = buildWhereClause(filters, replacements);
    if (where) {
        sql += ` WHERE ${where}`;
    }

    // 3. Finalize
    sql += ` LIMIT ${parseInt(limit)}`;

    console.log("[REPORT SQL]:", sql);
    
    return await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT
    });
};

module.exports = {
    executeComplexQuery,
    ALLOWED_TABLES
};
