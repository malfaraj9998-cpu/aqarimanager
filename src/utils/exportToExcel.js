import * as XLSX from 'xlsx';

/**
 * Exports an array of objects to an Excel (.xlsx) file and triggers a browser download.
 * @param {Array} data - Array of flat objects to export
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - Output file name (without extension)
 */
export function exportToExcel(data, sheetName = 'Sheet1', fileName = 'export') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Exports multiple datasets each to a separate sheet in one Excel file.
 * @param {Array<{data: Array, sheetName: string}>} sheets
 * @param {string} fileName
 */
export function exportMultiSheetToExcel(sheets, fileName = 'backup') {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ data, sheetName }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
