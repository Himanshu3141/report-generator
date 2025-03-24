// utils/xlsReport.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const generateXLSReport = async ({ overviewTable, jobData, cycleTimeData, downtimeReasons, scrapData, machineName }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Shift Report');

  // Header
  sheet.mergeCells('A1', 'C1');
  sheet.getCell('A1').value = `Shift Report - ${machineName}`;
  sheet.getCell('A1').font = { bold: true, size: 16 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // ➤ Section 1: Report Summary
  sheet.addRow([]);
  sheet.addRow(['Report Summary']);
  sheet.getRow(sheet.lastRow.number).font = { bold: true };
  sheet.addRow(['Sl No', 'Parameter', 'Value']).font = { bold: true };
  overviewTable.forEach(row => sheet.addRow(row));

  // ➤ Section 2: Job Data & Cycle Time
  sheet.addRow([]);
  sheet.addRow(['Jobs & Cycle Time']);
  sheet.getRow(sheet.lastRow.number).font = { bold: true };
  sheet.addRow(['Job', 'Avg Cycle Time']).font = { bold: true };
  jobData.forEach((job, i) => {
    sheet.addRow([job.name || '-', cycleTimeData[i] || '-']);
  });

  // ➤ Section 3: Downtime Reasons
  sheet.addRow([]);
  sheet.addRow(['Downtime Reasons']);
  sheet.getRow(sheet.lastRow.number).font = { bold: true };
  sheet.addRow(['Reason', 'Duration (mins)']).font = { bold: true };
  downtimeReasons.forEach(r => sheet.addRow([r.reason || '-', r.time || '-']));

  // ➤ Section 4: Scrap Data
  sheet.addRow([]);
  sheet.addRow(['Scrap Data']);
  sheet.getRow(sheet.lastRow.number).font = { bold: true };
  sheet.addRow(['Job', 'Scrap Count']).font = { bold: true };
  scrapData.forEach(s => sheet.addRow([s.job || '-', s.scrap || '-']));

  // File path
  const filePath = path.join(__dirname, `../temp/Shift_Report_${machineName}_${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
};

module.exports = generateXLSReport;
