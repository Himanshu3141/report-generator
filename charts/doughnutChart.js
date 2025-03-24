const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 600;
const height = 400;

async function createDoughnutChartImage(data, labels, title = '') {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          label: title,
          data: data,
          backgroundColor: [
            '#36A2EB', // Blue
            '#FFCE56', // Yellow
            '#FF6384', // Red
            '#4BC0C0', // Teal
            '#9966FF', // Purple
            '#FF9F40'  // Orange
          ],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 18
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}`;
            }
          }
        }
      }
    }
  };

  const image = await chartJSNodeCanvas.renderToDataURL(configuration);
  return image;
}

module.exports = {
  createDoughnutChartImage
};
