// src/components/PaymentModal.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, debt, onPaymentAdded }) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !debt) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      
      if (!amount || amount <= 0) {
        setError('Ingresa un monto válido');
        return;
      }

      if (amount > debt.pending_amount) {
        setError(`El monto no puede ser mayor al pendiente ($${debt.pending_amount.toLocaleString()})`);
        return;
      }

      const paymentData = {
        debt_id: debt.id,
        amount: amount,
        payment_date: formData.payment_date,
        notes: formData.notes.trim() || null
      };

      const { error: insertError } = await supabase
        .from('debt_payments')
        .insert([paymentData]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });

      onPaymentAdded();
    } catch (error) {
      console.error('Error adding payment:', error);
      setError(error.message || 'Error al agregar el pago');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setError(null);
    onClose();
  };

  // Calcular el monto recomendado por cuota
  const getRecommendedAmount = () => {
    if (debt.payment_type === 'installments' && debt.total_installments) {
      return debt.original_amount / debt.total_installments;
    }
    return debt.pending_amount;
  };

  const recommendedAmount = getRecommendedAmount();

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Agregar Pago</h2>
          <button className="close-btn" onClick={resetAndClose}>×</button>
        </div>

        <div className="debt-summary-info">
          <div className="debt-name">{debt.creditor_debtor_name}</div>
          <div className="debt-desc">{debt.title || debt.description}</div>
          <div className="pending-amount">
            Pendiente: <strong>${debt.pending_amount.toLocaleString()}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Monto del pago</label>
            <div className="amount-input">
              <span className="currency">$</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                max={debt.pending_amount}
                step="0.01"
                required
                autoFocus
              />
            </div>
            
            {debt.payment_type === 'installments' && (
              <div className="amount-suggestions">
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, amount: recommendedAmount.toFixed(2) }))}
                >
                  Cuota completa: ${recommendedAmount.toFixed(2)}
                </button>
                <button
                  type="button"
                  className="suggestion-btn"
                  onClick={() => setFormData(prev => ({ ...prev, amount: debt.pending_amount.toString() }))}
                >
                  Pagar todo: ${debt.pending_amount.toLocaleString()}
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Fecha del pago</label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Método de pago, detalles adicionales..."
              rows="3"
            />
          </div>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={resetAndClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
