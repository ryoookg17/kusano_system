
const fs = require('fs');
const path = require('path');

const dir = path.join('c:', 'Users', 'adki8', '.gemini', 'antigravity', 'scratch', 'kusano-system', 'apps', 'admin', 'templates');
const files = fs.readdirSync(dir);
console.log(files);
files.forEach(f => {
    const stats = fs.statSync(path.join(dir, f));
    console.log(`${f}: ${stats.size} bytes, ${stats.mtime}`);
});
