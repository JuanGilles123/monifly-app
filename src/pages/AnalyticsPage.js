// src/pages/AnalyticsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';
import './AnalyticsPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const monthKey = (isoDate) => {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

export default function AnalyticsPage({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setAuthError('');

      // 1) Obtén el usuario actual
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        if (active) {
          setAuthError('Error de autenticación. Inicia sesión nuevamente.');
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const userId = userData?.user?.id;
      if (!userId) {
        if (active) {
          setAuthError('No hay una sesión activa. Inicia sesión para ver tu análisis.');
          setRows([]);
          setLoading(false);
        }
        return;
      }

      // 2) Lee transacciones reales del usuario
      const { data, error } = await supabase
        .from('transactions')
        .select('type, category, amount, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('Error cargando transacciones:', error);
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, []);

  // --- Agregaciones ---
  const expensesByCategory = useMemo(() => {
    const acc = {};
    for (const r of rows.filter(r => r.type === 'expense')) {
      const k = r.category || 'Sin categoría';
      acc[k] = (acc[k] || 0) + Number(r.amount || 0);
    }
    return acc;
  }, [rows]);

  const monthly = useMemo(() => {
    const acc = {};
    for (const r of rows) {
      const k = monthKey(r.created_at);
      acc[k] ||= { income: 0, expense: 0 };
      const v = Number(r.amount || 0);
      if (r.type === 'income') acc[k].income += v;
      if (r.type === 'expense') acc[k].expense += v;
    }
    const keys = Object.keys(acc).sort();
    return { keys, acc };
  }, [rows]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    rows.forEach(r => {
      const v = Number(r.amount || 0);
      if (r.type === 'income') income += v;
      if (r.type === 'expense') expense += v;
    });
    return { income, expense, balance: income - expense };
  }, [rows]);

  // --- Datos para gráficos ---
  const pieData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        label: 'Gastos por Categoría',
        data: Object.values(expensesByCategory),
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: monthly.keys.length ? monthly.keys : ['Sin datos'],
    datasets: [
      {
        label: 'Ingresos',
        data: monthly.keys.map(k => monthly.acc[k].income),
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: monthly.keys.map(k => monthly.acc[k].expense),
        borderWidth: 1,
      },
    ],
  };

  // --- Estilos de gráficos según tema ---
  const textColor = isDarkMode ? '#e0e0e0' : '#444';
  const gridColor = isDarkMode ? '#444' : '#ddd';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            return `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${fmtCOP(v)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: { color: textColor, callback: (v) => fmtCOP(v) },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { color: 'transparent' },
      },
    },
  };

  return (
    <div className="analytics-container">
      <h1>Análisis Financiero</h1>

      {loading ? (
        <div className="analytics-card">Cargando...</div>
      ) : authError ? (
        <div className="analytics-card">{authError}</div>
      ) : rows.length === 0 ? (
        <div className="analytics-card">
          Aún no hay transacciones. Registra ingresos y gastos para ver el análisis.
        </div>
      ) : (
        <>
          <div className="analytics-cards-grid">
            <div className="analytics-card">
              <h3>Total Ingresos</h3>
              <p className="big">{fmtCOP(totals.income)}</p>
            </div>
            <div className="analytics-card">
              <h3>Total Gastos</h3>
              <p className="big">{fmtCOP(totals.expense)}</p>
            </div>
            <div className="analytics-card">
              <h3>Balance</h3>
              <p className="big">{fmtCOP(totals.balance)}</p>
            </div>
          </div>

          <div className="chart-wrapper">
            <h2>Gastos por Categoría</h2>
            <div style={{ height: 340 }}>
              <Pie data={pieData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-wrapper">
            <h2>Ingresos vs. Gastos por Mes</h2>
            <div style={{ height: 380 }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
