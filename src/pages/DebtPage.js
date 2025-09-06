// src/pages/DebtPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import DebtModal from '../components/DebtModal';
import DebtCard from '../components/DebtCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './DebtPage.css';

const DebtPage = ({ session, isDarkMode }) => {
  const [debts, setDebts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, me_deben, yo_debo
  const [sortBy, setSortBy] = useState('due_date'); // due_date, amount, created_at

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('debts')
        .select(`
          *,
          debt_payments (
            id,
            amount,
            payment_date,
            debt_id
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular el monto pendiente para cada deuda
      const debtsWithPending = data.map(debt => {
        const totalPaid = debt.debt_payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const pendingAmount = debt.original_amount - totalPaid;
        const isPaid = pendingAmount <= 0;
        
        return {
          ...debt,
          total_paid: totalPaid,
          pending_amount: pendingAmount,
          is_paid: isPaid
        };
      });

      setDebts(debtsWithPending);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleAddDebt = () => {
    setDebtToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditDebt = (debt) => {
    setDebtToEdit(debt);
    setIsModalOpen(true);
  };

  const handleDeleteDebt = async (debtId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta deuda?')) return;

    try {
      // Primero eliminar los pagos asociados
      await supabase
        .from('debt_payments')
        .delete()
        .eq('debt_id', debtId);

      // Luego eliminar la deuda
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId);

      if (error) throw error;

      fetchDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Error al eliminar la deuda');
    }
  };

  const handleMarkAsPaid = async (debt) => {
    if (debt.is_paid) return;

    const remainingAmount = debt.pending_amount;
    
    try {
      // Crear un pago por el monto restante
      // user_id se asigna automáticamente con auth.uid() en la BD
      const { error } = await supabase
        .from('debt_payments')
        .insert({
          debt_id: debt.id,
          amount: remainingAmount,
          payment_date: new Date().toISOString(),
          notes: 'Marcado como pagado completamente'
        });

      if (error) {
        console.error('Error en debt_payments:', error);
        throw error;
      }

      console.log('✅ Pago registrado exitosamente');
      fetchDebts();
    } catch (error) {
      console.error('Error marking debt as paid:', error);
      alert(`Error al marcar como pagado: ${error.message}`);
    }
  };

  const filteredDebts = debts.filter(debt => {
    if (filter === 'me_deben') return debt.type === 'debt_owed' && !debt.is_paid;
    if (filter === 'yo_debo') return debt.type === 'debt_owing' && !debt.is_paid;
    if (filter === 'paid') return debt.is_paid;
    return !debt.is_paid; // 'all' muestra solo las no pagadas
  });

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.pending_amount - a.pending_amount;
      case 'due_date':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'created_at':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Calcular estadísticas
  const totalOwedToMe = debts
    .filter(debt => debt.type === 'debt_owed' && !debt.is_paid)
    .reduce((sum, debt) => sum + debt.pending_amount, 0);

  const totalIOwe = debts
    .filter(debt => debt.type === 'debt_owing' && !debt.is_paid)
    .reduce((sum, debt) => sum + debt.pending_amount, 0);

  if (loading) {
    return (
      <div className="debt-page">
        <div className="page-header">
          <h1>Mis Deudas</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="debt-page">
      <div className="debt-header">
        <h1>Mis Deudas 💳</h1>
        <button className="create-debt-btn" onClick={handleAddDebt}>
          + Nueva Deuda
        </button>
      </div>

      {/* Estadísticas */}
      <div className="debt-stats">
        <div className="stat-card owed-to-me">
          <h3>Me deben</h3>
          <p className="amount">${totalOwedToMe.toLocaleString()}</p>
        </div>
        <div className="stat-card i-owe">
          <h3>Yo debo</h3>
          <p className="amount">${totalIOwe.toLocaleString()}</p>
        </div>
        <div className="stat-card balance">
          <h3>Balance</h3>
          <p className={`amount ${totalOwedToMe - totalIOwe >= 0 ? 'positive' : 'negative'}`}>
            ${(totalOwedToMe - totalIOwe).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filtros y ordenamiento */}
      <div className="debt-controls">
        <div className="filter-section">
          <h3 className="filter-title">Filtrar por:</h3>
          <div className="filter-chips">
            <button 
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`} 
              onClick={() => setFilter('all')}
            >
              📋 Pendientes
            </button>
            <button 
              className={`filter-chip ${filter === 'me_deben' ? 'active' : ''}`} 
              onClick={() => setFilter('me_deben')}
            >
              💰 Me deben
            </button>
            <button 
              className={`filter-chip ${filter === 'yo_debo' ? 'active' : ''}`} 
              onClick={() => setFilter('yo_debo')}
            >
              💸 Yo debo
            </button>
            <button 
              className={`filter-chip ${filter === 'paid' ? 'active' : ''}`} 
              onClick={() => setFilter('paid')}
            >
              ✅ Pagadas
            </button>
          </div>
        </div>

        <div className="sort-section">
          <label htmlFor="sort-select" className="sort-label">Ordenar por:</label>
          <select 
            id="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="due_date">📅 Fecha de vencimiento</option>
            <option value="amount">💵 Monto</option>
            <option value="created_at">🕒 Fecha de creación</option>
          </select>
        </div>
      </div>

      {/* Lista de deudas */}
      <div className="debts-list">
        {sortedDebts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h2>¡Registra tu primera deuda!</h2>
            <p>Mantén control de lo que debes y te deben</p>
            {filter === 'all' && (
              <button className="create-debt-btn primary" onClick={handleAddDebt}>
                Crear Deuda
              </button>
            )}
          </div>
        ) : (
          sortedDebts.map(debt => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={() => handleEditDebt(debt)}
              onDelete={() => handleDeleteDebt(debt.id)}
              onMarkAsPaid={() => handleMarkAsPaid(debt)}
              onPaymentAdded={fetchDebts}
            />
          ))
        )}
      </div>

      {/* Modal */}
      <DebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchDebts}
        existingDebt={debtToEdit}
      />
    </div>
  );
};

export default DebtPage;
