const fs = require('fs');

try {
    const content = fs.readFileSync('schema_dump.txt', 'utf16le'); // Read as UTF-16
    console.log("File read success. Length:", content.length);

    // Split by table sections if possible, or just look for keywords
    const lines = content.split('\n');
    let currentTable = '';

    for (const line of lines) {
        if (line.includes('Columns for')) {
            currentTable = line.trim();
            console.log('\n' + currentTable);
        } else if (line.includes(']')) {
            // End of array
            currentTable = '';
        } else if (currentTable) {
            // Inside columns array
            if (line.trim().length > 0) console.log(line.trim());
        }
    }

} catch (e) {
    console.error("Error reading file:", e.message);
}
