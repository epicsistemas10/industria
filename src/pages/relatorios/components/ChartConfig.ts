import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Configurações padrão dos gráficos
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#64748b',
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif',
        },
        padding: 15,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 12,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: {
          size: 11,
        },
      },
    },
  },
};

// Paleta de cores
export const chartColors = {
  primary: 'rgba(59, 130, 246, 0.8)',
  primaryLight: 'rgba(59, 130, 246, 0.2)',
  success: 'rgba(34, 197, 94, 0.8)',
  successLight: 'rgba(34, 197, 94, 0.2)',
  warning: 'rgba(251, 146, 60, 0.8)',
  warningLight: 'rgba(251, 146, 60, 0.2)',
  danger: 'rgba(239, 68, 68, 0.8)',
  dangerLight: 'rgba(239, 68, 68, 0.2)',
  purple: 'rgba(168, 85, 247, 0.8)',
  purpleLight: 'rgba(168, 85, 247, 0.2)',
  cyan: 'rgba(6, 182, 212, 0.8)',
  cyanLight: 'rgba(6, 182, 212, 0.2)',
};

export const multiColorPalette = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(34, 197, 94, 0.8)',
  'rgba(251, 146, 60, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(234, 179, 8, 0.8)',
];
