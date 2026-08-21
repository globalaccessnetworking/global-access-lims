const fs = require('fs');
const path = require('path');

function getFiles(dir, files = [], depth = 0) {
    if (depth > 6) return files; // prevent too deep recursion
    try {
        const list = fs.readdirSync(dir);
        for (const file of list) {
            if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'dist-ssr' || file === '$RECYCLE.BIN' || file === 'System Volume Information') continue;
            const name = path.join(dir, file);
            try {
                const stat = fs.statSync(name);
                if (stat.isDirectory()) {
                    getFiles(name, files, depth + 1);
                } else {
                    // Only log source/code/doc files
                    if (/\.(js|jsx|css|html|json|sql|txt|md|sh)$/i.test(file)) {
                        files.push({ name, mtime: stat.mtime });
                    }
                }
            } catch (e) {}
        }
    } catch (e) {}
    return files;
}

console.log("Searching for recently modified files across all folders on D drive...");
const allFiles = [];
// Scan directories on D:\
const rootDirs = fs.readdirSync('d:\\');
for (const dir of rootDirs) {
    if (dir === 'System Volume Information' || dir === '$RECYCLE.BIN') continue;
    const fullPath = path.join('d:\\', dir);
    try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getFiles(fullPath, allFiles);
        } else {
            if (/\.(js|jsx|css|html|json|sql|txt|md|sh)$/i.test(dir)) {
                allFiles.push({ name: fullPath, mtime: stat.mtime });
            }
        }
    } catch (e) {}
}

allFiles.sort((a, b) => b.mtime - a.mtime);

console.log("Top 30 recently modified code files on D drive:");
allFiles.slice(0, 30).forEach(f => {
    console.log(`- ${f.name} (Modified: ${f.mtime.toISOString()})`);
});
process.exit(0);
