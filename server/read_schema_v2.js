const fs = require('fs');

try {
    // Try reading as utf16le first
    let content = fs.readFileSync('schema_dump.txt', 'utf16le');
    if (!content.includes('Columns for')) {
        // Fallback to utf8
        content = fs.readFileSync('schema_dump.txt', 'utf8');
    }

    console.log("Read content length:", content.length);

    const tables = ['ext_bacterial_strains', 'ext_lab_stock', 'ext_bacteriophages'];

    for (const table of tables) {
        const index = content.indexOf(`Columns for ${table}`);
        if (index !== -1) {
            const part = content.substring(index, index + 2000); // 2000 chars context
            console.log(`\n--- ${table} ---`);
            console.log(part); // Output chunk
        } else {
            console.log(`\nCould not find columns for ${table}`);
        }
    }

} catch (e) {
    console.error("Error:", e.message);
}
