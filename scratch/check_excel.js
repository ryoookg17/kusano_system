
const ExcelJS = require('exceljs');
const path = require('path');


async function checkTemplate(fileName) {
    console.log(`--- Checking ${fileName} ---`);
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join('c:', 'Users', 'adki8', '.gemini', 'antigravity', 'scratch', 'kusano-system', fileName);
    try {
        await workbook.xlsx.readFile(filePath);
        console.log('Sheet names:', workbook.worksheets.map(s => s.name));
        for (const sheet of workbook.worksheets) {
            console.log(`\nSheet: ${sheet.name}`);
            for (let r = 1; r <= 50; r++) {

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
    } catch (e) {
        console.log('Error reading file:', e.message);
    }
}


async function run() {
    await checkTemplate('textbook_orders_20260428.xlsx');
    await checkTemplate('temp_excel.xlsx');
    await checkTemplate('temp_excel_2.xlsx');
}

run().catch(console.error);
