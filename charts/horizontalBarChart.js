const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Chart dimensions
const width = 800;
const height = 400;

async function createHorizontalBarChartImage(data, title) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  // Extract labels and values
  const labels = data.map(item => item.d);
  const values = data.map(item => item.v);

  const configuration = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',  // 🔥 Makes the chart horizontal
      responsive: true,
      scales: {
        x: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  };

  return await chartJSNodeCanvas.renderToDataURL(configuration);
}

module.exports = { createHorizontalBarChartImage };
