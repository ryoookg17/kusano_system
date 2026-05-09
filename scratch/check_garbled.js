
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const dir = path.join('c:', 'Users', 'adki8', '.gemini', 'antigravity', 'scratch', 'kusano-system', 'apps', 'admin', 'templates');
const files = fs.readdirSync(dir);
const targetFile = files.find(f => f.includes('艿') || f.includes('採用'));

if (targetFile) {
    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.readFile(path.join(dir, targetFile)).then(() => {
        console.log('File found:', targetFile);
        console.log('Sheets:', workbook.worksheets.map(s => s.name));
        const sheet = workbook.worksheets[0];
        for (let r = 1; r <= 20; r++) {
            let rowStr = '';
            for (let c = 1; c <= 12; c++) {
                const val = sheet.getRow(r).getCell(c).value;
                if (val) {
                    rowStr += `[${sheet.getRow(r).getCell(c).address}:${val}] `;
                }
            }
            if (rowStr) console.log(rowStr);
        }
    });
} else {
    console.log('Target file not found');
}
