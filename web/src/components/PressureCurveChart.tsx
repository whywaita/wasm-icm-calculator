import { useRef, useEffect } from "preact/hooks";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { PressureCurvePoint } from "../types";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

interface PressureCurveChartProps {
  t: (key: string) => string;
  curve: PressureCurvePoint[];
  entryFee?: number;
}

export function PressureCurveChart({
  t,
  curve,
  entryFee,
}: PressureCurveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datasets: any[] = [
      {
        label: t("chartPressure"),
        data: curve.map((p) => p.icmEquity),
        borderColor: "rgba(13, 148, 136, 1)",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ];

    if (entryFee !== undefined) {
      datasets.push({
        label: t("breakevenLine"),
        data: Array(curve.length).fill(entryFee),
        borderColor: "rgba(220, 38, 38, 0.8)",
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      });
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: curve.map((p) => p.stack.toString()),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: entryFee !== undefined },
        },
        scales: {
          x: {
            title: { display: true, text: t("chartPressureXAxis") },
            ticks: {
              callback(value) {
                const label = this.getLabelForValue(value as number);
                return Number(label).toLocaleString();
              },
            },
          },
          y: {
            title: { display: true, text: t("chartPressureYAxis") },
            beginAtZero: true,
            ticks: {
              callback(value) {
                return "$" + Number(value).toLocaleString();
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [curve, entryFee, t]);

  return (
    <div>
      <div class="chart-label">{t("chartPressure")}</div>
      <div class="chart-container">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
