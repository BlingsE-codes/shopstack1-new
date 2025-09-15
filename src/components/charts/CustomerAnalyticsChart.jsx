// src/components/charts/CustomerAnalyticsChart.js
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CustomerAnalyticsChart = ({ data }) => {
  // Sort customers by total spent and take top 10
  const sortedData = [...data].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  
  const chartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Total Spent (₦)',
        data: sortedData.map(item => item.totalSpent),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgb(79, 70, 229)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Number of Visits',
        data: sortedData.map(item => item.visits),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            if (datasetLabel.includes('Spent')) {
              return `${datasetLabel}: ₦${context.raw.toLocaleString()}`;
            }
            return `${datasetLabel}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          drawBorder: false
        },
        ticks: {
          callback: function(value) {
            return '₦' + value.toLocaleString();
          }
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CustomerAnalyticsChart;