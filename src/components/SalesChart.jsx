// components/SalesChart.js (with toggle and dual datasets)
import { Bar, Line } from 'react-chartjs-2';
import "../styles/dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);



const SalesChart = ({ 
  salesLabels, 
  salesValues, 
  profitLabels, 
  profitValues, 
  chartType = 'bar' 
}) => {
  const labels = salesLabels || profitLabels || [];

  const options = {
    responsive: true,
    maintainAspectRatio: false, // IMPORTANT for custom heights
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Daily Sales & Profit Overview' },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ₦${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Amount (₦)' } },
      x: { title: { display: true, text: 'Date' } },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Sales',
        data: salesValues || [],
        backgroundColor: chartType === 'bar' ? '#007bff' : 'transparent',
        borderColor: '#0069d9',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Profit',
        data: profitValues || [],
        backgroundColor: chartType === 'bar' ? '#e67a00' : 'transparent',
        borderColor: '#cc6d00',
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="chart-container">
      {chartType === 'bar' ? (
        <Bar options={options} data={data} />
      ) : (
        <Line options={options} data={data} />
      )}
    </div>
  );
};


export default SalesChart;