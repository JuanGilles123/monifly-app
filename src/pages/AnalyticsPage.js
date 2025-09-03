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

// Paletas de color (explícitas)
const PIE_COLORS = ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#E11D48'];
const PIE_BORDERS = '#00000022';
const BAR_INCOME_BG = '#22C55E';
const BAR_INCOME_BORDER = '#16A34A';
const BAR_EXPENSE_BG = '#EF4444';
const BAR_EXPENSE_BORDER = '#B91C1C';

export default function AnalyticsPage({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [goals, setGoals] = useState([]);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setAuthError('');

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

      const { data, error } = await supabase
        .from('transactions')
        .select('type, category, amount, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Cargar metas del usuario
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (error) {
        console.error('Error cargando transacciones:', error);
        setRows([]);
      } else {
        setRows(data || []);
      }

      if (goalsError) {
        console.error('Error cargando metas:', goalsError);
        setGoals([]);
      } else {
        setGoals(goalsData || []);
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

  // --- Estadísticas de metas ---
  const goalsStats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    let totalSaved = 0;
    let totalTarget = 0;
    let totalProgress = 0;
    
    activeGoals.forEach(goal => {
      const saved = Number(goal.current_saved || 0);
      const target = Number(goal.target_amount || 0);
      totalSaved += saved;
      totalTarget += target;
      if (target > 0) {
        totalProgress += (saved / target) * 100;
      }
    });
    
    const avgProgress = activeGoals.length > 0 ? totalProgress / activeGoals.length : 0;
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalSaved,
      totalTarget,
      avgProgress: Math.round(avgProgress),
      completionRate: goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0
    };
  }, [goals]);

  // --- Datos para gráficos ---
  const pieLabels = Object.keys(expensesByCategory);
  const pieValues = Object.values(expensesByCategory);

  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        label: 'Gastos por Categoría',
        data: pieValues,
        backgroundColor: pieLabels.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
        borderColor: PIE_BORDERS,
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
        backgroundColor: BAR_INCOME_BG,
        borderColor: BAR_INCOME_BORDER,
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: monthly.keys.map(k => monthly.acc[k].expense),
        backgroundColor: BAR_EXPENSE_BG,
        borderColor: BAR_EXPENSE_BORDER,
        borderWidth: 1,
      },
    ],
  };

  // --- Datos para gráfico de metas ---
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 6); // Mostrar máximo 6 metas
  
  const goalsProgressData = {
    labels: activeGoals.map(g => g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name),
    datasets: [
      {
        label: 'Progreso (%)',
        data: activeGoals.map(g => {
          const current = Number(g.current_saved || 0);
          const target = Number(g.target_amount || 0);
          return target > 0 ? Math.round((current / target) * 100) : 0;
        }),
        backgroundColor: activeGoals.map((_, i) => {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
          return colors[i % colors.length];
        }),
        borderColor: activeGoals.map((_, i) => {
          const colors = ['#1D4ED8', '#047857', '#D97706', '#B91C1C', '#7C3AED', '#0891B2'];
          return colors[i % colors.length];
        }),
        borderWidth: 2,
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
      legend: { labels: { color: textColor } },
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

  const chartOptionsGoals = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        labels: { color: textColor },
        display: true 
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const goalIndex = ctx.dataIndex;
            const goal = activeGoals[goalIndex];
            if (goal) {
              const current = Number(goal.current_saved || 0);
              const target = Number(goal.target_amount || 0);
              return [
                `${goal.name}`,
                `Progreso: ${ctx.parsed.y}%`,
                `Ahorrado: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(current)}`,
                `Meta: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(target)}`
              ];
            }
            return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(100, Math.max(...activeGoals.map(g => {
          const current = Number(g.current_saved || 0);
          const target = Number(g.target_amount || 0);
          return target > 0 ? Math.ceil((current / target) * 100) : 0;
        })) + 10),
        ticks: { 
          color: textColor, 
          callback: (v) => `${v}%`,
          stepSize: 10
        },
        grid: { color: gridColor },
      },
      x: {
        ticks: { 
          color: textColor,
          maxRotation: 45
        },
        grid: { color: 'transparent' },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutBounce'
    }
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

          {goals.length > 0 && (
            <div className="analytics-cards-grid">
              <div className="analytics-card">
                <h3>Metas Activas</h3>
                <p className="big">{goalsStats.activeGoals}</p>
                <p className="small">de {goalsStats.totalGoals} total</p>
              </div>
              <div className="analytics-card">
                <h3>Total Ahorrado</h3>
                <p className="big">{fmtCOP(goalsStats.totalSaved)}</p>
                <p className="small">Meta: {fmtCOP(goalsStats.totalTarget)}</p>
              </div>
              <div className="analytics-card">
                <h3>Progreso Promedio</h3>
                <p className="big">{goalsStats.avgProgress}%</p>
                <p className="small">{goalsStats.completedGoals} completadas</p>
              </div>
            </div>
          )}

          <div className="chart-wrapper">
            <h2>Gastos por Categoría</h2>
            {pieValues.length === 0 ? (
              <div className="analytics-card">Aún no hay gastos para graficar.</div>
            ) : (
              <div style={{ height: 340 }}>
                <Pie data={pieData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="chart-wrapper">
            <h2>Ingresos vs. Gastos por Mes</h2>
            <div style={{ height: 380 }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-wrapper">
            <h2>Progreso de Metas Activas</h2>
            {activeGoals.length === 0 ? (
              <div className="analytics-card">
                {goals.length === 0 
                  ? "Aún no tienes metas creadas. Ve a la sección de Metas para crear una."
                  : "No tienes metas activas para mostrar."
                }
              </div>
            ) : (
              <div style={{ height: 380 }} key={`goals-chart-${activeGoals.length}-${activeGoals.map(g => `${g.id}-${g.current_saved}`).join('-')}`}>
                <Bar 
                  data={goalsProgressData} 
                  options={chartOptionsGoals} 
                  key={`bar-${Date.now()}`}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
