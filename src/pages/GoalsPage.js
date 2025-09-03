import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import GoalModal from '../components/GoalModal';
import './GoalsPage.css';

const GoalsPage = ({ session }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Cargar metas desde Supabase
  useEffect(() => {
    if (session?.user) {
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      console.log('Cargando metas para user:', session.user.id);
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading goals:', error);
        return;
      }

      console.log('Metas cargadas desde DB:', data);
      if (data && data.length > 0) {
        console.log('Primera meta, campos disponibles:', Object.keys(data[0]));
        console.log('Primera meta completa:', data[0]);
      }
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current, target) => {
    if (!current || !target || target === 0) return 0;
    return Math.round((current / target) * 100);
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthsUntilTarget = (targetDate) => {
    if (!targetDate) return 0;
    
    const target = new Date(targetDate);
    const now = new Date();
    
    // Establecer día 1 del mes para comparar meses completos
    const targetMonth = new Date(target.getFullYear(), target.getMonth(), 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (targetMonth <= currentMonth) return 0;
    
    // Calcular diferencia en meses
    const diffYears = targetMonth.getFullYear() - currentMonth.getFullYear();
    const diffMonths = targetMonth.getMonth() - currentMonth.getMonth();
    
    return diffYears * 12 + diffMonths;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const calculateMonthlyRequired = (goal) => {
    if (!goal || !goal.target_amount || !goal.target_date) return 0;
    
    const monthsRemaining = getMonthsUntilTarget(goal.target_date);
    if (monthsRemaining <= 0) return 0;
    
    const remaining = (goal.target_amount || 0) - (goal.current_saved || 0);
    if (remaining <= 0) return 0;
    
    return Math.ceil(remaining / monthsRemaining);
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleSaveGoal = async (goalData) => {
    try {
      if (editingGoal) {
        // Actualizar meta existente
        const { data, error } = await supabase
          .from('goals')
          .update({
            name: goalData.title,
            description: goalData.description,
            target_amount: goalData.targetAmount,
            current_saved: goalData.currentAmount,
            target_date: goalData.targetDate,
            status: goalData.currentAmount >= goalData.targetAmount ? 'completed' : 'active'
          })
          .eq('id', editingGoal.id)
          .eq('user_id', session.user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating goal:', error);
          throw error;
        }

        console.log('Meta actualizada:', data);
      } else {
        // Crear nueva meta
        const { data, error } = await supabase
          .from('goals')
          .insert({
            user_id: session.user.id,
            name: goalData.title,
            description: goalData.description,
            target_amount: goalData.targetAmount,
            current_saved: goalData.currentAmount,
            target_date: goalData.targetDate,
            status: goalData.currentAmount >= goalData.targetAmount ? 'completed' : 'active'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating goal:', error);
          throw error;
        }

        console.log('Nueva meta creada:', data);
      }
      
      // Recargar metas desde la BD
      await loadGoals();
      
      setShowModal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la meta "${goal.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting goal:', error);
        alert('Error al eliminar la meta. Inténtalo de nuevo.');
        return;
      }

      console.log('Meta eliminada:', goal.name);
      alert('Meta eliminada exitosamente');
      
      // Recargar metas desde la BD
      await loadGoals();
      
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error al eliminar la meta. Inténtalo de nuevo.');
    }
  };

  const handleContribute = async (goal) => {
    console.log('Goal antes del aporte:', goal);
    console.log('Goal fields:', Object.keys(goal));
    console.log('Goal current_saved:', goal.current_saved);
    console.log('Goal target_amount:', goal.target_amount);
    const contribution = parseFloat(prompt(`¿Cuánto quieres aportar a "${goal.name}"?\n\nEjemplo: 100000 = $100.000 COP`, '0'));
    
    if (isNaN(contribution) || contribution <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    console.log('Contribution amount:', contribution);

    try {
      const newCurrentAmount = (goal.current_saved || 0) + contribution;
      const newStatus = newCurrentAmount >= (goal.target_amount || 0) ? 'completed' : 'active';

      console.log('Valores a actualizar:', {
        current_saved: newCurrentAmount,
        status: newStatus,
        goal_id: goal.id,
        user_id: session.user.id
      });

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_saved: newCurrentAmount,
          status: newStatus
        })
        .eq('id', goal.id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating contribution:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert('Error al registrar el aporte. Inténtalo de nuevo.');
        return;
      }

      console.log('Aporte registrado:', data);
      alert(`¡Aporte de ${formatCurrency(contribution)} registrado exitosamente!`);
      
      // Recargar metas desde la BD
      console.log('Recargando metas...');
      await loadGoals();
      
    } catch (error) {
      console.error('Error contributing to goal:', error);
      alert('Error al registrar el aporte. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="goals-container">
        <h1>Mis Metas</h1>
        <div className="loading">Cargando metas...</div>
      </div>
    );
  }

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h1>Mis Metas 🎯</h1>
        <button 
          className="create-goal-btn"
          onClick={handleCreateGoal}
        >
          + Nueva Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h2>¡Crea tu primera meta!</h2>
          <p>Define objetivos de ahorro y te ayudamos a alcanzarlos</p>
          <button 
            className="create-goal-btn primary"
            onClick={handleCreateGoal}
          >
            Crear Meta
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(goal => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <h3>{goal.name}</h3>
                <span className={`status-badge ${goal.status}`}>
                  {goal.status === 'active' ? 'Activa' : 'Completada'}
                </span>
              </div>
              
              <p className="goal-description">{goal.description}</p>
              
              <div className="goal-amounts">
                <div className="amount-info">
                  <span className="label">Objetivo:</span>
                  <span className="amount target">{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="amount-info">
                  <span className="label">Ahorrado:</span>
                  <span className="amount current">{formatCurrency(goal.current_saved)}</span>
                </div>
              </div>
              
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{width: `${calculateProgress(goal.current_saved, goal.target_amount)}%`}}
                  ></div>
                </div>
                <span className="progress-text">
                  {calculateProgress(goal.current_saved, goal.target_amount)}% completado
                </span>
              </div>
              
              <div className="goal-timeline">
                <div className="timeline-info">
                  <span className="label">Fecha objetivo:</span>
                  <span className="date">{formatDate(goal.target_date)}</span>
                </div>
                <div className="timeline-info">
                  <span className="label">Faltan:</span>
                  <span className="months">{getMonthsUntilTarget(goal.target_date)} meses</span>
                </div>
              </div>
              
              <div className="monthly-required">
                <strong>Ahorro mensual necesario: {formatCurrency(calculateMonthlyRequired(goal))}</strong>
              </div>
              
              <div className="goal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleEditGoal(goal)}
                >
                  Editar
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleContribute(goal)}
                >
                  Aportar
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteGoal(goal)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.9rem',
                    padding: '8px 12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GoalModal
        isOpen={showModal}
        onClose={handleCloseModal}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />
    </div>
  );
};

export default GoalsPage;
