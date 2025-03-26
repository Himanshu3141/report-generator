const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const PdfPrinter = require('pdfmake');


const app = express();
const PORT = 5000;


const reportData = JSON.parse(fs.readFileSync(path.join(__dirname, './data/reports-single.json'), 'utf8'));


const outputDir = path.join(__dirname, './output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });


const fonts = {
  Roboto: {
    normal: path.join(__dirname, './fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, './fonts/Roboto-Medium.ttf'),
    italics: path.join(__dirname, './fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, './fonts/Roboto-MediumItalic.ttf'),
  }
};

const printer = new PdfPrinter(fonts);


app.get('/download/xls', (req, res) => {
    try {
      const workbook = XLSX.utils.book_new();
  
      const overviewData = [
        ['Sl No', 'Parameter', 'Value'],
        ['1', 'Machine Name', reportData.machine],
        ['2', 'Shift Date', reportData.shiftDate],
        ['3', 'Shift No', reportData.shiftNo],
        ['4', 'Total Cycles', reportData.cycle],
        ['5', 'Total Downtime (s)', reportData.idl],
        ['6', 'OEE', `${reportData.oee}%`],
        ['7', 'Availability', `${reportData.avly}%`],
        ['8', 'Performance', `${reportData.prf}%`],
        ['9', 'Quality', `${reportData.qly}%`]
      ];
      
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      wsOverview['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, wsOverview, 'Overview');
  
      // Downtime Reasons
      const downtimeData = [['Reason', 'Downtime (s)'], ...reportData.dwnPie.map(({ _id, downTime }) => [_id, downTime])];
      const wsDowntime = XLSX.utils.aoa_to_sheet(downtimeData);
      wsDowntime['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsDowntime, 'Downtime Reasons');
  
      // Hourly Production
      const hrProdData = [['Hour', 'Count'], ...reportData.hrprd.map(({ hr, count }) => [hr, count])];
      const wsHrProd = XLSX.utils.aoa_to_sheet(hrProdData);
      wsHrProd['!cols'] = [{ wch: 10 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsHrProd, 'Hourly Production');
  
      // Scrap Data (Optimized)
      const scrapCount = reportData.scrps.reduce((acc, { part }) => {
        acc[part] = (acc[part] || 0) + 1;
        return acc;
      }, {});
  
      const scrapData = [['Part', 'Count'], ...Object.entries(scrapCount).map(([part, count]) => [part, count])];
      const wsScrap = XLSX.utils.aoa_to_sheet(scrapData);
      wsScrap['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsScrap, 'Scrap Data');
  
      
      const fileName = `Report_${reportData.machine}_${reportData.shiftDate}.xls`;
      const xlsPath = path.join(outputDir, fileName);
  
     
      XLSX.writeFile(workbook, xlsPath, { bookType: 'xls' });
  
      
      res.download(xlsPath, fileName, (err) => {
        if (!err) fs.unlinkSync(xlsPath);
      });
  
    } catch (error) {
      console.error("❌ XLS Generation Error:", error);
      res.status(500).send('Error generating XLS report.');
    }
  });
  


app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
