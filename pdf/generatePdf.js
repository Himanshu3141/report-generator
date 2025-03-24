const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const moment = require('moment');
const { createBarChartImage } = require('../charts/barChart');



const reportData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reports-single.json'), 'utf8'));


const fonts = {
  Roboto: {
    normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
    italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf'),
  }
};

const printer = new PdfPrinter(fonts);

(async () => {
  const jobCycleMap = {};
  reportData.cycles.forEach(c => {
    if (!jobCycleMap[c.part]) jobCycleMap[c.part] = [];
    jobCycleMap[c.part].push(c.cycleTime);
  });

  const avgCycleData = Object.entries(jobCycleMap).map(([job, times]) => ({
    d: job,
    y: 1,
    v: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  }));
  const chartImageCycle = await createBarChartImage(avgCycleData, 'Avg Cycle Time (s)', 's');

 
  const dwnData = reportData.dwnPie.filter(d => d._id).map(d => ({
    d: d._id,
    y: 1,
    v: d.downTime
  }));
  const chartImageDowntimeReason = await createBarChartImage(dwnData, 'Downtime (s)', 's');

  
  const hrProdData = reportData.hrprd.map(h => ({
    d: h.hr,
    y: 1,
    v: h.count
  }));
  const chartImageCount = await createBarChartImage(hrProdData, 'Production Count');

  
  const oeeData = [{ d: reportData.shiftDate, y: 1, v: parseFloat(reportData.oee) }];
  const chartImageOEE = await createBarChartImage(oeeData, 'OEE', '%');


  const overviewTable = [
    ['1', 'Machine Name', reportData.machine],
    ['2', 'Shift Date', reportData.shiftDate],
    ['3', 'Shift No', reportData.shiftNo],
    ['4', 'Total Cycles', reportData.cycle],
    ['5', 'Total Downtime (s)', reportData.idl],
    ['6', 'OEE', reportData.oee + '%'],
    ['7', 'Availability', reportData.avly + '%'],
    ['8', 'Performance', reportData.prf + '%'],
    ['9', 'Quality', reportData.qly + '%']
  ];

  const logoPath = path.join(__dirname, '../data/logo.png');
  const logo = fs.existsSync(logoPath)
    ? fs.readFileSync(logoPath).toString('base64')
    : null;

  const docDefinition = {
    pageMargins: [40, 80, 10, 80],
    header: {
      margin: 8,
      columns: [
        {
          table: {
            widths: ['30%', '40%', '30%'],
            body: [
              [
                { text: `From ${reportData.start} to ${reportData.end}`, style: 'bodyText', alignment: 'left' },
                { text: `Shift Report (${reportData.machine})`, style: 'header', alignment: 'center' },
                logo ? { image: 'data:image/png;base64,' + logo, width: 80, height: 40, alignment: 'right' } : ''
              ]
            ]
          },
          layout: 'headerLineOnly'
        }
      ]
    },
    content: [
      { text: 'Report Summary', style: 'subHeader' },
      {
        style: 'tableExample',
        table: {
          widths: [100, 220, 200],
          body: [['Sl no', 'Parameter', 'Value'], ...overviewTable]
        },
        layout: 'lightHorizontalLines'
      },
      { text: 'OEE Chart', style: 'subHeader' },
      { image: chartImageOEE, width: 500, alignment: 'center', margin: [0, 10, 0, 10] },
      { text: 'Production Count', style: 'subHeader' },
      { image: chartImageCount, width: 500, alignment: 'center', margin: [0, 10, 0, 10] },
      { text: 'Average Cycle Time', style: 'subHeader' },
      { image: chartImageCycle, width: 500, alignment: 'center', margin: [0, 10, 0, 10] },
      { text: 'Downtime Reasons', style: 'subHeader' },
      { image: chartImageDowntimeReason, width: 500, alignment: 'center', margin: [0, 10, 0, 10] }
    ],
    footer: {
      margin: [5, 60],
      columns: [
        '© Company Name',
        { text: moment().format('DD-MM-YYYY HH:mm'), alignment: 'right' }
      ]
    },
    styles: {
      header: { fontSize: 20, bold: true, margin: [0, 20, 0, 10] },
      subHeader: { fontSize: 16, bold: false, margin: [0, 20, 0, 10], decoration: "underline" },
      bodyText: { fontSize: 10, bold: false },
      tableExample: { margin: [0, 5, 0, 15] }
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const outputPath = path.join(__dirname, `../output/Report_${reportData.machine}_${reportData.shiftDate}.pdf`);
  pdfDoc.pipe(fs.createWriteStream(outputPath));
  pdfDoc.end();
  console.log(`✅ PDF saved to: ${outputPath}`);
})();
