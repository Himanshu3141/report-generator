const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { formatTime } = require('../utils/formatTime'); 


const width = 800;
const height = 400;

async function createBarChartImage(data, type, unit = '', format = false) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  
  const xValues = Array.from(new Set(data.map(item => item.d)));

 
  const shiftNumbers = Array.from(new Set(data.map(item => item.y)));

  const datasets = shiftNumbers.map(shift => {
    const shiftData = xValues.map(label => {
      const entry = data.find(item => item.d === label && item.y === shift);
      return entry ? entry.v : 0;
    });

    return {
      label: `Shift ${shift}`,
      data: shiftData,
      backgroundColor:
        shift === 1
          ? 'rgba(75, 192, 192, 1)'
          : shift === 2
          ? 'rgba(255, 99, 132, 1)'
          : 'rgba(153, 102, 255, 1)',
      borderColor:
        shift === 1
          ? 'rgba(75, 192, 192, 1)'
          : shift === 2
          ? 'rgba(255, 99, 132, 1)'
          : 'rgba(153, 102, 255, 1)',
      borderWidth: 1,
      barPercentage: 0.7,
      categoryPercentage: 0.7,
      borderRadius: 4,
    };
  });

  const configuration = {
    type: 'bar',
    data: {
      labels: xValues,
      datasets: datasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: datasets.length > 1 },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          title: { display: true, text: 'Label' },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: type },
          ticks: {
            callback: (val) =>
              format ? formatTime(val) : type === 'OEE' ? `${val}%` : val,
          },
        },
      },
    },
    plugins: [
      {
        id: 'barLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
              const value = dataset.data[index];
              ctx.fillStyle = 'black';
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(
                format ? formatTime(value) : value,
                bar.x,
                bar.y - 10
              );
            });
          });
        },
      },
    ],
  };

  const image = await chartJSNodeCanvas.renderToDataURL(configuration);
  return image;
}

module.exports = {
  createBarChartImage,
};
