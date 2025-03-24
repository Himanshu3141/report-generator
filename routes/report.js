const express = require('express');
const fs = require('fs');
const path = require('path');
const generateXLSReport = require('./utils/xlsReport'); // path as per your project

const router = express.Router();

router.get('/report/download-xls', async (req, res) => {
  try {
    // 🔹 Replace with your actual data fetch logic
    const overviewTable = [
      [1, 'Total Production', '800'],
      [2, 'Total Downtime', '45 mins'],
      [3, 'OEE', '85%']
    ];

    const jobData = [
      { name: 'Job A' }, { name: 'Job B' }, { name: 'Job C' }
    ];

    const cycleTimeData = ['1.5s', '2.0s', '1.8s'];

    const downtimeReasons = [
      { reason: 'Tool Change', time: 25 },
      { reason: 'Power Cut', time: 20 }
    ];

    const scrapData = [
      { job: 'Job A', scrap: 4 },
      { job: 'Job B', scrap: 2 }
    ];

    const machineName = 'Machine-1';

    const filePath = await generateXLSReport({ overviewTable, jobData, cycleTimeData, downtimeReasons, scrapData, machineName });

    res.download(filePath, err => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('File download error');
      } else {
        // Clean up file after sending
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during XLS generation');
  }
});

module.exports = router;
