import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './DebtModal.css';

const DEFAULT_DEBT = {
  title: '',
  description: '',
  original_amount: '',
  type: 'debt_owing',
  payment_type: 'fixed',
  payment_frequency: 'monthly',
  total_installments: 1,
  due_date: '',
  creditor_debtor_name: '',
  status: 'active',
};

const DebtModal = ({ isOpen, onClose, onSave, existingDebt = null }) => {
  const [debtData, setDebtData] = useState(DEFAULT_DEBT);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Definir los pasos del formulario
  const steps = [
    {
      id: 'basics',
      title: '💳 Información Básica',
      subtitle: 'Empecemos con lo esencial',
      icon: '📝',
      fields: ['title', 'description', 'original_amount']
    },
    {
      id: 'type',
      title: '🏷️ Tipo de Deuda',
      subtitle: '¿Quién le debe a quién?',
      icon: '🤝',
      fields: ['type', 'creditor_debtor_name']
    },
    {
      id: 'payment',
      title: '💰 Forma de Pago',
      subtitle: 'Define cómo se pagará',
      icon: '📊',
      fields: ['payment_type', 'payment_frequency', 'total_installments']
    },
    {
      id: 'details',
      title: '📅 Detalles Finales',
      subtitle: 'Últimos ajustes',
      icon: '✅',
      fields: ['due_date', 'status']
    }
  ];

  // Validar si un paso está completo
  const isStepComplete = (stepIndex) => {
    const step = steps[stepIndex];
    const requiredFields = step.fields.filter(field => {
      if (field === 'payment_frequency' || field === 'total_installments') {
        return debtData.payment_type === 'installments';
      }
      if (field === 'description' || field === 'creditor_debtor_name' || field === 'due_date') {
        return false; // Campos opcionales
      }
      return true;
    });

    return requiredFields.every(field => {
      const value = debtData[field];
      if (field === 'original_amount') {
        const amount = parseFloat(value);
        return value && amount > 0;
      }
      return value && value.toString().trim() !== '';
    });
  };

  // Actualizar pasos completados
  useEffect(() => {
    const newCompleted = new Set();
    steps.forEach((_, index) => {
      if (isStepComplete(index)) {
        newCompleted.add(index);
      }
    });
    setCompletedSteps(newCompleted);
  }, [debtData]);

  // Navegación entre pasos
  const goToStep = (stepIndex) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 300);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user || null);
    };
    getCurrentUser();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDebtData(prev => ({ ...prev, [name]: value }));
  };

  // Función para renderizar cada paso
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
                        <span>Es una deuda que tengo que pagar</span>
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
                        <span>Es dinero que me deben a mí</span>
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
                        <span>Se paga todo de una vez</span>
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
                        <span>Se paga en varias partes</span>
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
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const debtPayload = {
        // user_id se asigna automáticamente con auth.uid() en la BD
        title: debtData.title,
        description: debtData.description || null,
        original_amount: amount,
        remaining_amount: amount,
        type: debtData.type, // 'debt_owed' | 'debt_owing'
        payment_type: debtData.payment_type, // 'fixed' | 'installments'
        payment_frequency:
          debtData.payment_type === 'installments'
            ? debtData.payment_frequency // 'weekly' | 'biweekly' | 'monthly'
            : null,
        total_installments:
          debtData.payment_type === 'installments'
            ? parseInt(debtData.total_installments, 10)
            : 0,
        paid_installments: 0,
        due_date: debtData.due_date || null,
        status: debtData.status, // 'active' | 'paid' | 'overdue' | 'cancelled'
        creditor_debtor_name: debtData.creditor_debtor_name || null,
      };

      let result;
      if (existingDebt?.id) {
        result = await supabase
          .from('debts')
          .update(debtPayload)
          .eq('id', existingDebt.id)
          .select();
      } else {
        result = await supabase.from('debts').insert([debtPayload]).select();
      }

      if (result.error) {
        let msg = result.error.message || 'Error al guardar la deuda.';
        // Pistas típicas por CHECKs
        if (/payment_type/i.test(msg)) {
          msg =
            'Tipo de pago inválido. Usa solo "fixed" o "installments". Revisa las restricciones de la tabla.';
        } else if (/payment_frequency/i.test(msg)) {
          msg =
            'Frecuencia inválida. Usa solo "weekly", "biweekly" o "monthly" (aplica si es por cuotas).';
        } else if (/status/i.test(msg)) {
          msg =
            'Estado inválido. Usa solo "active", "paid", "overdue" o "cancelled".';
        } else if (/type.*check/i.test(msg)) {
          msg =
            'Tipo de deuda inválido. Usa solo "debt_owed" (me deben) o "debt_owing" (yo debo).';
        } else if (/row-level security|RLS/i.test(msg)) {
          msg = 'No tienes permisos para esta operación (RLS).';
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      onSave?.(result.data?.[0]);
      onClose?.();
    } catch (err) {
      setErrorMessage('Error inesperado al guardar la deuda.');
      // Opcional: console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-container">
        <div className="modal-header">
          <h2>{existingDebt ? '✏️ Editar Deuda' : '💳 Nueva Deuda'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
          <div 
            className="form-progress" 
            style={{ width: `${formProgress}%` }}
          ></div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errorMessage && (
            <div className="error-message">
              <p
                style={{
                  whiteSpace: 'pre-line',
                  color: '#e74c3c',
                  background: '#fdf2f2',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #f5c6cb',
                }}
              >
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">📋 Título de la Deuda</label>
            <input
              type="text"
              id="title"
              name="title"
              value={debtData.title}
              onChange={handleInputChange}
              placeholder="Nombre corto para la deuda"
              required
              autoComplete="off"
              className={validationErrors.title ? 'error' : ''}
            />
            {validationErrors.title && (
              <span className="field-error">{validationErrors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">📝 Descripción</label>
            <input
              type="text"
              id="description"
              name="description"
              value={debtData.description}
              onChange={handleInputChange}
              placeholder="¿De qué se trata esta deuda?"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="original_amount">💰 Monto</label>
            <input
              type="number"
              id="original_amount"
              name="original_amount"
              value={debtData.original_amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              inputMode="decimal"
              className={validationErrors.original_amount ? 'error' : ''}
            />
            {validationErrors.original_amount && (
              <span className="field-error">{validationErrors.original_amount}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="type">🏷️ Tipo</label>
            <select
              id="type"
              name="type"
              value={debtData.type}
              onChange={handleInputChange}
              required
            >
              <option value="debt_owed">💰 Me deben a mí</option>
              <option value="debt_owing">💸 Yo debo</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="payment_type">📋 Forma de Pago</label>
            <select
              id="payment_type"
              name="payment_type"
              value={debtData.payment_type}
              onChange={handleInputChange}
              required
            >
              <option value="fixed">🔒 Pago único / fijo</option>
              <option value="installments">🔢 En cuotas</option>
            </select>
          </div>

          {showInstallmentFields && (
            <div className="installment-fields">
              <div className="form-group">
                <label htmlFor="payment_frequency">⏰ Frecuencia</label>
                <select
                  id="payment_frequency"
                  name="payment_frequency"
                  value={debtData.payment_frequency}
                  onChange={handleInputChange}
                  required
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
                  required
                  inputMode="numeric"
                  className={validationErrors.total_installments ? 'error' : ''}
                />
                {validationErrors.total_installments && (
                  <span className="field-error">{validationErrors.total_installments}</span>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="due_date">📅 Fecha de Vencimiento</label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={debtData.due_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="creditor_debtor_name">👤 Nombre (acreedor/deudor)</label>
            <input
              type="text"
              id="creditor_debtor_name"
              name="creditor_debtor_name"
              value={debtData.creditor_debtor_name}
              onChange={handleInputChange}
              placeholder="Persona o entidad"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">📌 Estado</label>
            <select
              id="status"
              name="status"
              value={debtData.status}
              onChange={handleInputChange}
              required
            >
              <option value="active">Activo</option>
              <option value="paid">Pagado</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ❌ Cancelar
            </button>
            <button 
              type="submit" 
              className={`btn-primary ${isLoading ? 'btn-loading' : ''}`}
              disabled={isLoading || Object.keys(validationErrors).length > 0}
            >
              {isLoading ? '' : existingDebt ? '✅ Actualizar' : '💾 Crear Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
