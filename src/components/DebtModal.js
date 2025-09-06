// src/components/DebtModal.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './DebtModal.css';

const DEFAULT_DEBT = {
  title: '',
  description: '',
  original_amount: '',
  type: 'debt_owing',          // 'debt_owing' | 'debt_owed'
  payment_type: 'fixed',        // 'fixed' | 'installments'
  payment_frequency: 'monthly', // 'weekly' | 'biweekly' | 'monthly' (si installments)
  total_installments: 1,
  due_date: '',
  creditor_debtor_name: '',
  status: 'active',             // 'active' | 'paid' | 'overdue' | 'cancelled'
};

const DebtModal = ({ isOpen, onClose, onSave, existingDebt = null }) => {
  const [debtData, setDebtData] = useState(DEFAULT_DEBT);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // UI estado (pasos)
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Wizard: definición de pasos (ids y campos)
  const steps = [
    {
      id: 'basics',
      title: '💳 Información Básica',
      subtitle: 'Empecemos con lo esencial',
      icon: '📝',
      fields: ['title', 'description', 'original_amount'],
    },
    {
      id: 'type',
      title: '🏷️ Tipo de Deuda',
      subtitle: '¿Quién le debe a quién?',
      icon: '🤝',
      fields: ['type', 'creditor_debtor_name'],
    },
    {
      id: 'payment',
      title: '💰 Forma de Pago',
      subtitle: 'Define cómo se pagará',
      icon: '📊',
      fields: ['payment_type', 'payment_frequency', 'total_installments'],
    },
    {
      id: 'details',
      title: '📅 Detalles Finales',
      subtitle: 'Últimos ajustes',
      icon: '✅',
      fields: ['due_date', 'status'],
    },
  ];

  // Validación por paso (mantiene tu lógica y campos opcionales)
  const isStepComplete = (stepIndex) => {
    const step = steps[stepIndex];
    const requiredFields = step.fields.filter((field) => {
      if (field === 'payment_frequency' || field === 'total_installments') {
        return debtData.payment_type === 'installments';
      }
      if (field === 'description' || field === 'creditor_debtor_name' || field === 'due_date') {
        return false; // opcionales
      }
      return true;
    });

    return requiredFields.every((field) => {
      const value = debtData[field];
      if (field === 'original_amount') {
        const amount = parseFloat(value);
        return value && !Number.isNaN(amount) && amount > 0;
      }
      return value && value.toString().trim() !== '';
    });
  };

  // Marca pasos completos cuando cambian datos
  useEffect(() => {
    const newCompleted = new Set();
    steps.forEach((_, idx) => {
      if (isStepComplete(idx)) newCompleted.add(idx);
    });
    setCompletedSteps(newCompleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtData]);

  // Navegación entre pasos con animación
  const goToStep = (stepIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 300);
  };
  const nextStep = () => currentStep < steps.length - 1 && goToStep(currentStep + 1);
  const prevStep = () => currentStep > 0 && goToStep(currentStep - 1);

  // Usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setCurrentUser(data?.user || null);
    };
    getCurrentUser();
  }, []);

  // Al abrir modal, cargar deuda existente o default
  useEffect(() => {
    if (!isOpen) return;

    if (existingDebt) {
      const incoming = {
        title: existingDebt.title || existingDebt.description || '',
        description: existingDebt.description || '',
        original_amount: existingDebt.original_amount?.toString?.() || '',
        type: existingDebt.type || 'debt_owing',
        payment_type: existingDebt.payment_type || 'fixed',
        payment_frequency: existingDebt.payment_frequency || 'monthly',
        total_installments: existingDebt.total_installments || 1,
        due_date: existingDebt.due_date
          ? new Date(existingDebt.due_date).toISOString().split('T')[0]
          : '',
        creditor_debtor_name: existingDebt.creditor_debtor_name || '',
        status: existingDebt.status || 'active',
      };
      setDebtData(incoming);
    } else {
      setDebtData(DEFAULT_DEBT);
    }

    setErrorMessage('');
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, [existingDebt, isOpen]);

  // Manejo de inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDebtData((prev) => ({ ...prev, [name]: value }));
  };

  // Render de cada paso (marcado compatible con tu CSS existente)
  const renderStep = (stepIndex) => {
    const step = steps[stepIndex];

    switch (step.id) {
      case 'basics':
        return (
        <div className="step-content">
          <div className="step-header">
            <div className="step-icon">{step.icon}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
            </div>
          </div>

          <div className="step-fields">
            <div className="form-group">
              <label htmlFor="title">✨ Título de la Deuda</label>
              <input
                type="text"
                id="title"
                name="title"
                value={debtData.title}
                onChange={handleInputChange}
                placeholder="Ej: Préstamo personal, Factura médica..."
                className={debtData.title ? 'filled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="original_amount">💰 Monto Total</label>
              <input
                type="number"
                id="original_amount"
                name="original_amount"
                value={debtData.original_amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={debtData.original_amount ? 'filled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">📝 Descripción (Opcional)</label>
              <textarea
                id="description"
                name="description"
                value={debtData.description}
                onChange={handleInputChange}
                placeholder="Detalles adicionales sobre esta deuda..."
                rows="3"
                className={debtData.description ? 'filled' : ''}
              />
            </div>
          </div>
        </div>
        );

      case 'type':
        return (
        <div className="step-content">
          <div className="step-header">
            <div className="step-icon">{step.icon}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
            </div>
          </div>

          <div className="step-fields">
            <div className="form-group">
              <label>💼 Tipo de Deuda</label>

              <div className="radio-group">
                <div className={`radio-option ${debtData.type === 'debt_owing' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="debt_owing"
                    name="type"
                    value="debt_owing"
                    checked={debtData.type === 'debt_owing'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="debt_owing">
                    <div className="radio-icon">💸</div>
                    <div>
                      <strong>Yo debo</strong>
                    </div>
                  </label>
                </div>

                <div className={`radio-option ${debtData.type === 'debt_owed' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="debt_owed"
                    name="type"
                    value="debt_owed"
                    checked={debtData.type === 'debt_owed'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="debt_owed">
                    <div className="radio-icon">💰</div>
                    <div>
                      <strong>Me deben</strong>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="creditor_debtor_name">
                👤 {debtData.type === 'debt_owing' ? 'Acreedor' : 'Deudor'} (Opcional)
              </label>
              <input
                type="text"
                id="creditor_debtor_name"
                name="creditor_debtor_name"
                value={debtData.creditor_debtor_name}
                onChange={handleInputChange}
                placeholder={debtData.type === 'debt_owing' ? 'A quién le debo' : 'Quién me debe'}
                className={debtData.creditor_debtor_name ? 'filled' : ''}
              />
            </div>
          </div>
        </div>
        );

      case 'payment':
        return (
        <div className="step-content">
          <div className="step-header">
            <div className="step-icon">{step.icon}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
            </div>
          </div>

          <div className="step-fields">
            <div className="form-group">
              <label>💳 Forma de Pago</label>

              <div className="radio-group">
                <div className={`radio-option ${debtData.payment_type === 'fixed' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="fixed"
                    name="payment_type"
                    value="fixed"
                    checked={debtData.payment_type === 'fixed'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="fixed">
                    <div className="radio-icon">🔒</div>
                    <div>
                      <strong>Pago único</strong>
                    </div>
                  </label>
                </div>

                <div className={`radio-option ${debtData.payment_type === 'installments' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="installments"
                    name="payment_type"
                    value="installments"
                    checked={debtData.payment_type === 'installments'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="installments">
                    <div className="radio-icon">🔢</div>
                    <div>
                      <strong>En cuotas</strong>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {debtData.payment_type === 'installments' && (
              <div className="installment-section">
                <div className="form-group">
                  <label htmlFor="payment_frequency">⏰ Frecuencia de Pago</label>
                  <select
                    id="payment_frequency"
                    name="payment_frequency"
                    value={debtData.payment_frequency}
                    onChange={handleInputChange}
                    className={debtData.payment_frequency ? 'filled' : ''}
                  >
                    <option value="weekly">📅 Semanal</option>
                    <option value="biweekly">📆 Quincenal</option>
                    <option value="monthly">🗓️ Mensual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="total_installments">🔢 Número de Cuotas</label>
                  <input
                    type="number"
                    id="total_installments"
                    name="total_installments"
                    value={debtData.total_installments}
                    onChange={handleInputChange}
                    min="1"
                    max="120"
                    placeholder="¿Cuántas cuotas?"
                    className={debtData.total_installments > 1 ? 'filled' : ''}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        );

      case 'details':
        return (
        <div className="step-content">
          <div className="step-header">
            <div className="step-icon">{step.icon}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.subtitle}</p>
            </div>
          </div>

          <div className="step-fields">
            <div className="form-group">
              <label htmlFor="due_date">📅 Fecha de Vencimiento (Opcional)</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={debtData.due_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={debtData.due_date ? 'filled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">📌 Estado Inicial</label>
              <select
                id="status"
                name="status"
                value={debtData.status}
                onChange={handleInputChange}
                className="filled"
              >
                <option value="active">✅ Activo</option>
                <option value="paid">💚 Pagado</option>
                <option value="overdue">⚠️ Vencido</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>

            <div className="debt-summary">
              <h4>📋 Resumen de la Deuda</h4>
              <div className="summary-item">
                <span>Título:</span>
                <strong>{debtData.title || 'Sin título'}</strong>
              </div>
              <div className="summary-item">
                <span>Monto:</span>
                <strong>${debtData.original_amount || '0.00'}</strong>
              </div>
              <div className="summary-item">
                <span>Tipo:</span>
                <strong>{debtData.type === 'debt_owing' ? 'Yo debo' : 'Me deben'}</strong>
              </div>
              <div className="summary-item">
                <span>Pago:</span>
                <strong>{debtData.payment_type === 'fixed' ? 'Único' : `${debtData.total_installments} cuotas`}</strong>
              </div>
              {debtData.creditor_debtor_name && (
                <div className="summary-item">
                  <span>{debtData.type === 'debt_owing' ? 'Acreedor' : 'Deudor'}:</span>
                  <strong>{debtData.creditor_debtor_name}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
        );

      default:
        return null;
    }
  };

  // Envío (con user_id para cumplir RLS)
  const handleSubmit = async () => {
    if (!currentUser) {
      setErrorMessage('Usuario no autenticado.');
      return;
    }

    // Validaciones rápidas
    if (!debtData.title.trim()) {
      setErrorMessage('El título es obligatorio.');
      return;
    }
    const amount = parseFloat(debtData.original_amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setErrorMessage('El monto debe ser un número mayor que 0.');
      return;
    }
    if (debtData.payment_type === 'installments') {
      const ti = parseInt(debtData.total_installments, 10);
      if (!ti || ti < 1) {
        setErrorMessage('Debes indicar un número de cuotas válido (≥ 1).');
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        user_id: currentUser.id, // 👈 NECESARIO para pasar la policy WITH CHECK(user_id = auth.uid())
        title: debtData.title,
        description: debtData.description || null,
        original_amount: amount,
        remaining_amount: amount,
        type: debtData.type,                 // 'debt_owed' | 'debt_owing'
        payment_type: debtData.payment_type, // 'fixed' | 'installments'
        payment_frequency:
          debtData.payment_type === 'installments' ? debtData.payment_frequency : null,
        total_installments:
          debtData.payment_type === 'installments' ? parseInt(debtData.total_installments, 10) : 0,
        paid_installments: 0,
        due_date: debtData.due_date || null,
        status: debtData.status, // 'active' | 'paid' | 'overdue' | 'cancelled'
        creditor_debtor_name: debtData.creditor_debtor_name || null,
      };

      let result;
      if (existingDebt?.id) {
        result = await supabase
          .from('debts')
          .update(payload)
          .eq('id', existingDebt.id)
          .select();
      } else {
        result = await supabase.from('debts').insert([payload]).select();
      }

      if (result.error) {
        let msg = result.error.message || 'Error al guardar la deuda.';
        if (/row-level security|RLS/i.test(msg)) msg = 'No tienes permisos para esta operación (RLS).';
        else if (/payment_type/i.test(msg))      msg = 'Tipo de pago inválido. Usa "fixed" o "installments".';
        else if (/payment_frequency/i.test(msg)) msg = 'Frecuencia inválida. Usa "weekly", "biweekly" o "monthly".';
        else if (/status/i.test(msg))            msg = 'Estado inválido. Usa "active", "paid", "overdue" o "cancelled".';
        else if (/type.*check|type/i.test(msg))  msg = 'Tipo inválido. Usa "debt_owed" o "debt_owing".';
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      onSave?.(result.data?.[0]);
      onClose?.();
    } catch {
      setErrorMessage('Error inesperado al guardar la deuda.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="debt-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="debt-modal">
        {/* Header con indicador de progreso */}
        <div className="debt-header">
          <div className="header-content">
            <h2>{existingDebt ? '✏️ Editar Deuda' : '💳 Nueva Deuda'}</h2>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>

          {/* Indicador de pasos */}
          <div className="step-indicator">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${completedSteps.has(index) ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
                title={step.title}
              >
                {completedSteps.has(index) ? (
                  <div className="check-mark">✓</div>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="debt-content">
          {errorMessage && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{errorMessage}</span>
              <button className="error-close" onClick={() => setErrorMessage('')}>✕</button>
            </div>
          )}

          <div className={`step-container ${isAnimating ? 'animating' : ''}`}>
            {renderStep(currentStep)}
          </div>
        </div>

        {/* Navegación */}
        <div className="debt-navigation">
          <button
            type="button"
            className="nav-button secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            ← Anterior
          </button>

          <div className="nav-info">
            <span>{currentStep + 1} de {steps.length}</span>
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              className={`nav-button primary ${isStepComplete(currentStep) ? '' : 'disabled'}`}
              onClick={nextStep}
              disabled={!isStepComplete(currentStep)}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className={`nav-button primary ${isLoading ? 'loading' : ''}`}
              onClick={handleSubmit}
              disabled={isLoading || !isStepComplete(currentStep)}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Guardando...
                </>
              ) : (
                existingDebt ? '✅ Actualizar' : '💾 Crear Deuda'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtModal;
