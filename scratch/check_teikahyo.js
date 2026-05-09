
const ExcelJS = require('exceljs');
const path = require('path');

async function check() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join('c:', 'Users', 'adki8', '.gemini', 'antigravity', 'scratch', 'kusano-system', 'apps', 'admin', 'templates', '定価表.xlsx');
    await workbook.xlsx.readFile(filePath);
    console.log('Sheet names:', workbook.worksheets.map(s => s.name));
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
}
check();
