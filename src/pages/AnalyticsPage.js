import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './AnalyticsPage.css';

// Necesario para que Chart.js funcione con React
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- DATOS DE EJEMPLO (en el futuro vendrán de tu base de datos) ---
const sampleTransactions = [
  { type: 'expense', category: 'Comida', amount: 85000 },
  { type: 'expense', category: 'Transporte', amount: 42000 },
  { type: 'expense', category: 'Entretenimiento', amount: 60000 },
  { type: 'expense', category: 'Comida', amount: 35000 },
  { type: 'expense', category: 'Cuentas y Pagos', amount: 150000 },
  { type: 'income', amount: 1500000 },
  { type: 'income', amount: 200000 },
];
// --- FIN DE DATOS DE EJEMPLO ---


// Procesamos los datos para el gráfico de pastel
const expensesByCategory = sampleTransactions
  .filter(t => t.type === 'expense')
  .reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {});

const pieData = {
  labels: Object.keys(expensesByCategory),
  datasets: [{
    label: 'Gastos por Categoría',
    data: Object.values(expensesByCategory),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
  }],
};

// Procesamos los datos para el gráfico de barras
const totalIncome = sampleTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
const totalExpense = sampleTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

const barData = {
    labels: ['Septiembre'], // Podrías tener más meses en el futuro
    datasets: [
        {
            label: 'Ingresos',
            data: [totalIncome],
            backgroundColor: '#4BC0C0',
        },
        {
            label: 'Gastos',
            data: [totalExpense],
            backgroundColor: '#FF6384',
        }
    ]
};


const AnalyticsPage = ({ isDarkMode }) => {
  // Determina el color del texto basado en el tema
  const textColor = isDarkMode ? '#e0e0e0' : '#666';

  // Añade un objeto de opciones para los gráficos
  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: textColor, // Color para el texto de la leyenda (ej: 'Comida')
        }
      }
    },
    scales: {
      y: {
        ticks: { color: textColor }, // Color para las etiquetas del eje Y
        grid: { color: isDarkMode ? '#444' : '#ddd' } // Color para las líneas de la cuadrícula
      },
      x: {
        ticks: { color: textColor }, // Color para las etiquetas del eje X
        grid: { color: 'transparent' }
      }
    }
  };

  return (
    <div className="analytics-container">
      <h1>Análisis Financiero</h1>
      <div className="chart-wrapper">
        <h2>Gastos por Categoría</h2>
        {/* Pasa las opciones a los gráficos */}
        <Pie data={pieData} options={chartOptions} />
      </div>
      <div className="chart-wrapper">
        <h2>Ingresos vs. Gastos</h2>
        <Bar data={barData} options={chartOptions} />
      </div>
    </div>
  );
};

export default AnalyticsPage;