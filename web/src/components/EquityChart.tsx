import { useRef, useEffect } from "preact/hooks";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import type { PlayerResult } from "../types";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  annotationPlugin,
);

interface EquityChartProps {
  t: (key: string) => string;
  players: PlayerResult[];
  showBounty: boolean;
  entryFee?: number;
}

export function EquityChart({
  t,
  players,
  showBounty,
  entryFee,
}: EquityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = players.map((p) => p.name);

    const icmColors = players.map((p) => {
      if (entryFee === undefined) return "rgba(13, 148, 136, 0.7)";
      const equity = showBounty ? (p.totalEquity ?? p.icmEquity) : p.icmEquity;
      return equity >= entryFee
        ? "rgba(13, 148, 136, 0.7)"
        : "rgba(220, 38, 38, 0.7)";
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datasets: any[] = showBounty
      ? [
          {
            type: "bar" as const,
            label: t("icmDollar"),
            data: players.map((p) => p.icmEquity),
            backgroundColor: icmColors,
            stack: "equity",
          },
          {
            type: "bar" as const,
            label: t("bountyEq"),
            data: players.map((p) => p.bountyEquity ?? 0),
            backgroundColor: "rgba(180, 83, 9, 0.7)",
            stack: "equity",
          },
        ]
      : [
          {
            type: "bar" as const,
            label: t("icmDollar"),
            data: players.map((p) => p.icmEquity),
            backgroundColor: icmColors,
          },
        ];

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: showBounty || entryFee !== undefined,
            labels:
              entryFee !== undefined
                ? {
                    generateLabels(chart) {
                      const original =
                        Chart.defaults.plugins.legend.labels.generateLabels(
                          chart,
                        );
                      original.push({
                        text: t("breakevenLine"),
                        strokeStyle: "rgba(220, 38, 38, 0.8)",
                        fillStyle: "transparent",
                        lineDash: [6, 4],
                        lineWidth: 2,
                        hidden: false,
                        pointStyle: "line",
                      });
                      return original;
                    },
                  }
                : undefined,
          },
          annotation:
            entryFee !== undefined
              ? {
                  annotations: {
                    breakevenLine: {
                      type: "line",
                      yMin: entryFee,
                      yMax: entryFee,
                      borderColor: "rgba(220, 38, 38, 0.8)",
                      borderDash: [6, 4],
                      borderWidth: 2,
                      drawTime: "afterDatasetsDraw",
                      label: {
                        display: false,
                      },
                    },
                  },
                }
              : {},
        },
        scales: {
          x: { stacked: showBounty },
          y: { stacked: showBounty, beginAtZero: true },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [players, showBounty, entryFee, t]);

  return (
    <div>
      <div class="chart-label">{t("chartEquity")}</div>
      <div class="chart-container">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
