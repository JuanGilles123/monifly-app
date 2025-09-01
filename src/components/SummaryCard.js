import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './SummaryCard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- Helper para formatear la moneda ---
const formatCurrency = (amount) => {
  // Asegurarnos de que el monto sea un número antes de formatear
  const numberAmount = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberAmount);
};
// --- Fin del Helper ---

const SummaryCard = ({ transactions }) => {
  // Calculamos los totales a partir de las transacciones reales
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  // Preparamos los datos para el gráfico de dona
  const chartData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['#34d399', '#ef4444'],
        borderColor: ['var(--card-bg-color)'],
        borderWidth: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda por defecto
      },
    },
  };

  return (
    <div className="summary-card">
      <h3>Resumen del Mes</h3>
      <div className="balance-section">
        <span className="balance-label">Balance Actual</span>
        <span className="balance-amount">{formatCurrency(balance)}</span>
      </div>

      <div className="chart-container">
        <Doughnut data={chartData} options={chartOptions} />
      </div>

      <div className="totals-section">
        <div className="total-item">
          <span className="total-label income-color">Ingresos</span>
          <span className="total-amount">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="total-item">
          <span className="total-label expense-color">Gastos</span>
          <span className="total-amount">{formatCurrency(totalExpenses)}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

