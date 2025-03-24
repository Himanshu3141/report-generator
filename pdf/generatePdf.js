const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const moment = require('moment');

const { createBarChartImage } = require('../charts/barChart');
const { createDoughnutChartImage } = require('../charts/doughnutChart');
const { createHorizontalBarChartImage } = require('../charts/horizontalBarChart');

// Load Report JSON Data
const reportData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reports-single.json'), 'utf8'));

// Fonts Setup
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
  // ===============================
  // 1️⃣ Doughnut Chart (OEE Metrics)
  // ===============================
  const doughnutMetrics = [
    parseFloat(reportData.oee),
    parseFloat(reportData.avly),
    parseFloat(reportData.prf),
    parseFloat(reportData.qly)
  ];
  const doughnutLabels = ['OEE', 'Availability', 'Performance', 'Quality'];
  const chartImageDoughnut = await createDoughnutChartImage(doughnutMetrics, doughnutLabels, 'OEE Metrics');

  // =====================================
  // 2️⃣ Horizontal Bar Chart (Downtime Reasons)
  // =====================================
  const downtimeData = reportData.dwnPie
    .filter(item => item._id)
    .map(item => ({ d: item._id, v: item.downTime }));
  const chartImageDowntimeReason = await createHorizontalBarChartImage(downtimeData, 'Downtime Reasons');

  // ======================================
  // 3️⃣ Average Cycle Time Per Job (Bar Chart)
  // ======================================
  const jobCycleMap = {};
  reportData.cycles.forEach(({ part, cycleTime }) => {
    if (!jobCycleMap[part]) jobCycleMap[part] = [];
    jobCycleMap[part].push(cycleTime);
  });

  const avgCycleData = Object.entries(jobCycleMap).map(([job, times]) => ({
    d: job,
    y: 1,
    v: Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  }));
  const chartImageCycle = await createBarChartImage(avgCycleData, 'Avg Cycle Time (s)', 's');

  // ====================================
  // 4️⃣ Hourly Production Count (Bar Chart)
  // ====================================
  const hrProdData = reportData.hrprd.map(({ hr, count }) => ({
    d: hr,
    y: 1,
    v: count
  }));
  const chartImageCount = await createBarChartImage(hrProdData, 'Production Count');

  // ===========================
  // 5️⃣ Scrap Count (Bar Chart)
  // ===========================
  const scrapCountMap = {};
  reportData.scrps.forEach(({ part }) => {
    scrapCountMap[part] = (scrapCountMap[part] || 0) + 1;
  });

  const scrapData = Object.entries(scrapCountMap).map(([part, count]) => ({
    d: part,
    y: 1,
    v: count
  }));
  const chartImageScrap = await createBarChartImage(scrapData, 'Scrap Count');

  // ======================
  // 📄 Overview Table Data
  // ======================
  const overviewTable = [
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

  // =======================
  // 🖼 Logo Handling
  // =======================
  const logoPath = path.join(__dirname, '../data/logo.png');
  const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : null;

  // ==========================
  // 📄 PDF Document Definition
  // ==========================
  // ✅ Build PDF Document Definition
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
            ]
          ]
        },
        layout: 'headerLineOnly'
      }
    ]
  },
  content: [
    // ➤ Page 1: Report Summary (top) + OEE Metrics (bottom)
    {
      stack: [
        { text: 'Report Summary', style: 'subHeaderSmall', alignment: 'center' },
        {
          style: 'tableExample',
          table: {
            widths: [100, 220, 200],
            body: [['Sl no', 'Parameter', 'Value'], ...overviewTable]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15]
        },
        { text: 'OEE Metrics', style: 'subHeaderSmall', alignment: 'center' },
        { image: chartImageDoughnut, width: 380, alignment: 'center', margin: [0, 10, 0, 20] }
      ]
    },
  
    // ➤ Page 2: Hourly Production Count + Average Cycle Time Per Job
    { text: '', pageBreak: 'before' },
    {
      stack: [
        { text: 'Hourly Production Count', style: 'subHeaderSmall', alignment: 'center' },
        { image: chartImageCount, width: 380, alignment: 'center', margin: [0, 10, 0, 20] },
        { text: 'Average Cycle Time Per Job', style: 'subHeaderSmall', alignment: 'center' },
        { image: chartImageCycle, width: 380, alignment: 'center', margin: [0, 10, 0, 20] }
      ]
    },
  
    // ➤ Page 3: Downtime Reasons + Scrap Data Per Job
    { text: '', pageBreak: 'before' },
    {
      stack: [
        { text: 'Downtime Reasons', style: 'subHeaderSmall', alignment: 'center' },
        { image: chartImageDowntimeReason, width: 380, alignment: 'center', margin: [0, 10, 0, 20] },
        { text: 'Scrap Data Per Job', style: 'subHeaderSmall', alignment: 'center' },
        { image: chartImageScrap, width: 380, alignment: 'center', margin: [0, 10, 0, 20] }
      ]
    }
  ],
  
  styles: {
    header: { fontSize: 20, bold: true, margin: [0, 20, 0, 10] },
    subHeader: { fontSize: 16, bold: false, margin: [0, 20, 0, 10], decoration: "underline" },
    subHeaderSmall: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
    bodyText: { fontSize: 10, bold: false },
    tableExample: { margin: [0, 5, 0, 15] }
  }
  
  
  
};

  // ===========================
  // 📤 Save PDF to Output Path
  // ===========================
  const outputDir = path.join(__dirname, '../output');
  const outputPath = path.join(outputDir, `Report_${reportData.machine}_${reportData.shiftDate}.pdf`);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream(outputPath));
  pdfDoc.end();

  console.log(`✅ PDF saved to: ${outputPath}`);
})();
