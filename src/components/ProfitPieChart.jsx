// src/components/ProfitPieChart.jsx
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import dayjs from "dayjs";

Chart.register(...registerables);

export default function ProfitPieChart({ labels, values }) {
  const today = dayjs().format("ddd"); // e.g. "Mon", "Tue"

  return (
    <div className="chart-container" style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <Pie
        data={{
          labels,
          datasets: [
            {
              label: "Daily Profit",
              data: values,
              backgroundColor: [
                "#6fa8dc", // soft blue
                "#e06666", // soft red
                "#93c47d", // soft green
                "#ffd966", // soft yellow
                "#8e7cc3", // soft purple
                "#76a5af", // teal
                "#c27ba0", // rose
              ],
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#333",
                font: (ctx) => {
                  const label = ctx.text;
                  return {
                    size: 11,
                    weight: label === today ? "bold" : "normal", // bold today's date
                  };
                },
              },
            },
          },
        }}
        height={360}
        width={360}
      />
    </div>
  );
}
