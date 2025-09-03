import React, { useState, useEffect } from 'react';
import './GoalModal.css';

const GoalModal = ({ isOpen, onClose, goal = null, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      // Manejar diferentes formatos de fecha
      let targetDate = goal.targetDate || goal.target_date || '';
      if (targetDate) {
        // Convertir fecha a formato YYYY-MM-DD si es necesario
        const dateObj = new Date(targetDate);
        if (!isNaN(dateObj.getTime())) {
          targetDate = dateObj.toISOString().split('T')[0];
        } else {
          targetDate = '';
        }
      }
      
      setFormData({
        title: goal.title || goal.name || '',
        description: goal.description || '',
        targetAmount: (goal.targetAmount || goal.target_amount || '').toString(),
        currentAmount: (goal.currentAmount || goal.current_saved || 0).toString(),
        targetDate: targetDate
      });
    } else {
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: ''
      });
    }
    setErrors({});
  }, [goal, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'El monto objetivo debe ser mayor a 0';
    }

    if (parseFloat(formData.currentAmount) < 0) {
      newErrors.currentAmount = 'El monto actual no puede ser negativo';
    }

    if (parseFloat(formData.currentAmount) > parseFloat(formData.targetAmount)) {
      newErrors.currentAmount = 'El monto actual no puede ser mayor al objetivo';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'La fecha objetivo es obligatoria';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        newErrors.targetDate = 'La fecha objetivo debe ser posterior a hoy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: formData.targetDate,
        status: 'active'
      };

      await onSave(goalData);
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      setErrors({ submit: 'Error al guardar la meta. Inténtalo de nuevo.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const calculateMonthlyRequired = () => {
    if (!formData.targetAmount || !formData.targetDate || 
        isNaN(formData.targetAmount) || parseFloat(formData.targetAmount) <= 0) {
      return 0;
    }
    
    const targetDate = new Date(formData.targetDate);
    const today = new Date();
    
    if (targetDate <= today) return 0;
    
    // Calcular meses reales hasta la fecha objetivo
    const targetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const diffYears = targetMonth.getFullYear() - currentMonth.getFullYear();
    const diffMonths = targetMonth.getMonth() - currentMonth.getMonth();
    const monthsRemaining = Math.max(1, diffYears * 12 + diffMonths);
    
    const targetAmount = parseFloat(formData.targetAmount) || 0;
    const currentAmount = parseFloat(formData.currentAmount) || 0;
    const remaining = targetAmount - currentAmount;
    
    if (remaining <= 0) return 0;
    
    return Math.ceil(remaining / monthsRemaining);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="goal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{goal ? 'Editar Meta' : 'Nueva Meta'}</h2>
          <button 
            type="button" 
            className="close-btn"
            onClick={handleClose}
            disabled={isSaving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="form-group">
            <label htmlFor="title">Título de la Meta *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="ej. Fondo de emergencia"
              className={errors.title ? 'error' : ''}
              disabled={isSaving}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe tu meta financiera..."
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Montos */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="targetAmount">Monto Objetivo *</label>
              <input
                type="number"
                id="targetAmount"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="5000000"
                min="0"
                step="1000"
                className={errors.targetAmount ? 'error' : ''}
                disabled={isSaving}
              />
              {errors.targetAmount && <span className="error-message">{errors.targetAmount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currentAmount">Monto Actual</label>
              <input
                type="number"
                id="currentAmount"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1000"
                className={errors.currentAmount ? 'error' : ''}
                disabled={isSaving}
              />
              {errors.currentAmount && <span className="error-message">{errors.currentAmount}</span>}
            </div>
          </div>

          {/* Fecha objetivo */}
          <div className="form-group">
            <label htmlFor="targetDate">Fecha Objetivo *</label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
              className={errors.targetDate ? 'error' : ''}
              disabled={isSaving}
            />
            {errors.targetDate && <span className="error-message">{errors.targetDate}</span>}
          </div>

          {/* Información de ahorro mensual */}
          {formData.targetAmount && formData.targetDate && (
            <div className="monthly-info">
              <div className="info-card">
                <span className="info-label">Ahorro mensual requerido:</span>
                <span className="info-value">
                  ${calculateMonthlyRequired().toLocaleString('es-CO', { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0 
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Error de envío */}
          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          {/* Botones */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : (goal ? 'Actualizar' : 'Crear Meta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
