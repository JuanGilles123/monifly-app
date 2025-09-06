// src/components/DebtCard.js
import React, { useState } from 'react';
import PaymentModal from './PaymentModal';
import './DebtCard.css';

const DebtCard = ({ debt, onEdit, onDelete, onMarkAsPaid, onPaymentAdded }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = () => {
    if (!debt.due_date) return null;
    const today = new Date();
    const dueDate = new Date(debt.due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusClass = () => {
    if (debt.status === 'paid') return 'paid';
    
    const daysUntilDue = getDaysUntilDue();
    if (daysUntilDue === null) return 'no-due-date';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'due-soon';
    return 'normal';
  };

  const getStatusText = () => {
    if (debt.status === 'paid') return 'Pagada';
    
    const daysUntilDue = getDaysUntilDue();
    if (daysUntilDue === null) return 'Sin fecha límite';
    if (daysUntilDue < 0) return `Vencida hace ${Math.abs(daysUntilDue)} días`;
    if (daysUntilDue === 0) return 'Vence hoy';
    if (daysUntilDue <= 7) return `Vence en ${daysUntilDue} días`;
    return `Vence ${formatDate(debt.due_date)}`;
  };

  const getProgressPercentage = () => {
    const originalAmount = debt.original_amount || 0;
    const remainingAmount = debt.remaining_amount || 0;
    const totalPaid = originalAmount - remainingAmount;
    if (originalAmount === 0) return 0;
    return Math.min((totalPaid / originalAmount) * 100, 100);
  };

  const getTotalPaid = () => {
    return (debt.original_amount || 0) - (debt.remaining_amount || 0);
  };

  return (
    <>
      <div className={`debt-card ${debt.type} ${getStatusClass()}`}>
        <div className="debt-card-header">
          <div className="debt-info">
            <div className="debt-type-badge">
              {debt.type === 'i_owe' ? '💸 Yo debo' : '💰 Me deben'}
            </div>
            <h3 className="creditor-name">{debt.creditor_debtor_name || 'Sin nombre'}</h3>
            <p className="debt-description">{debt.description || debt.title || 'Sin descripción'}</p>
          </div>
          <div className="debt-actions">
            <button className="action-btn edit" onClick={onEdit} title="Editar">
              ✏️
            </button>
            <button className="action-btn delete" onClick={onDelete} title="Eliminar">
              🗑️
            </button>
          </div>
        </div>

        <div className="debt-amounts">
          <div className="amount-row">
            <span className="label">Total:</span>
            <span className="amount total">${(debt.original_amount || 0).toLocaleString()}</span>
          </div>
          
          {getTotalPaid() > 0 && (
            <div className="amount-row">
              <span className="label">Pagado:</span>
              <span className="amount paid">${getTotalPaid().toLocaleString()}</span>
            </div>
          )}
          
          <div className="amount-row pending">
            <span className="label">Pendiente:</span>
            <span className="amount">${(debt.remaining_amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Barra de progreso */}
        {getTotalPaid() > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <span className="progress-text">
              {getProgressPercentage().toFixed(0)}% pagado
            </span>
          </div>
        )}

        <div className="debt-status">
          <span className={`status-text ${getStatusClass()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Información de cuotas */}
        {debt.payment_type === 'installments' && (
          <div className="installment-info">
            <span className="installment-text">
              {debt.total_installments || 0} cuotas {debt.payment_frequency === 'weekly' ? 'semanales' : 'mensuales'} 
              de ${((debt.original_amount || 0) / (debt.total_installments || 1)).toFixed(2)}
            </span>
            <span className="installment-progress">
              {debt.paid_installments || 0} de {debt.total_installments || 0} pagadas
            </span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="debt-card-footer">
          <button 
            className="detail-btn" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          
          {debt.status !== 'paid' && (
            <div className="payment-actions">
              <button 
                className="payment-btn partial" 
                onClick={() => setShowPaymentModal(true)}
              >
                Agregar pago
              </button>
              <button 
                className="payment-btn full" 
                onClick={onMarkAsPaid}
              >
                Marcar como pagada
              </button>
            </div>
          )}
        </div>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="debt-details">
            <div className="detail-row">
              <strong>Fecha de creación:</strong>
              <span>{formatDate(debt.created_date || debt.created_at)}</span>
            </div>
            
            {debt.due_date && (
              <div className="detail-row">
                <strong>Fecha de vencimiento:</strong>
                <span>{formatDate(debt.due_date)}</span>
              </div>
            )}

            {debt.next_payment_date && (
              <div className="detail-row">
                <strong>Próximo pago:</strong>
                <span>{formatDate(debt.next_payment_date)}</span>
              </div>
            )}

            {debt.has_interest && (
              <div className="detail-row">
                <strong>Tasa de interés:</strong>
                <span>{debt.interest_rate || 0}%</span>
              </div>
            )}
            
            {debt.notes && (
              <div className="detail-row">
                <strong>Notas:</strong>
                <span>{debt.notes}</span>
              </div>
            )}

            {debt.debt_payments && debt.debt_payments.length > 0 && (
              <div className="payments-history">
                <strong>Historial de pagos:</strong>
                <div className="payments-list">
                  {debt.debt_payments.map(payment => (
                    <div key={payment.id} className="payment-item">
                      <span className="payment-date">
                        {formatDate(payment.payment_date)}
                      </span>
                      <span className="payment-amount">
                        ${(payment.amount || 0).toLocaleString()}
                      </span>
                      {payment.payment_method && (
                        <span className="payment-method">
                          {payment.payment_method}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        debt={debt}
        onPaymentAdded={() => {
          onPaymentAdded();
          setShowPaymentModal(false);
        }}
      />
    </>
  );
};

export default DebtCard;
