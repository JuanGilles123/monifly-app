import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './TransactionModal.css';

const TransactionModal = ({ isOpen, onClose, type, session, onTransactionSaved, transactionToEdit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    account: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isExpense = type === 'expense';
  const isEditing = transactionToEdit !== null;

  // Efecto para rellenar el formulario si estamos en modo edición
  useEffect(() => {
    if (isEditing) {
      setFormData({
        amount: transactionToEdit.amount || '',
        description: transactionToEdit.description || '',
        category: transactionToEdit.category || '',
        account: transactionToEdit.account || '',
      });
      setStep(4); // Empezamos en el último paso para ver todos los datos
    } else {
      // Reseteamos el formulario si no estamos editando
      setFormData({ amount: '', description: '', category: '', account: '' });
      setStep(1);
    }
  }, [transactionToEdit, isOpen]); // Se ejecuta cuando cambia el objeto a editar o cuando se abre/cierra el modal

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const resetAndClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    // Construimos el objeto de la transacción con el tipo correcto
    const transactionData = {
      ...formData,
      user_id: session.user.id,
      type: isExpense ? 'expense' : 'income'
    };
  
    let query;
    if (isEditing) {
      // Si estamos editando, hacemos un 'update'
      query = supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', transactionToEdit.id);
    } else {
      // Si no, hacemos un 'insert'
      query = supabase
        .from('transactions')
        .insert(transactionData);
    }
  
    const { error } = await query;
  
    setLoading(false);
    if (error) {
      console.error('Error guardando transacción:', error);
      setError(`Error al guardar: ${error.message}`);
    } else {
      onTransactionSaved(); // Avisamos al Dashboard que refresque los datos
      resetAndClose();
    }
  };

  const formTitle = isEditing ? `Editar ${isExpense ? 'Gasto' : 'Ingreso'}` : `Registrar ${isExpense ? 'Gasto' : 'Ingreso'}`;
  const totalSteps = 4;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{formTitle}</h2>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        
        {/* Mostramos el error si existe */}
        {error && <p className="error-message">{error}</p>}

        <form className="multi-step-form" onSubmit={handleSubmit}>
          {isExpense ? (
            <>
              {/* Pasos para Gasto */}
              <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <label>¿Cuál fue el monto?</label>
                <input type="number" name="amount" placeholder="0.00" value={formData.amount} onChange={handleInputChange} required />
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                <label>¿En qué gastaste?</label>
                <input type="text" name="description" placeholder="Ej: Café con amigos" value={formData.description} onChange={handleInputChange} required />
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                <label>Elige la categoría</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Selecciona...</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="entretenimiento">Entretenimiento</option><option value="cuentas">Cuentas y Pagos</option><option value="otros">Otros</option>
                </select>
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 4 ? 'active' : ''}`}>
                <label>¿Desde qué cuenta pagaste?</label>
                <select name="account" value={formData.account} onChange={handleInputChange} required>
                    <option value="">Selecciona...</option><option value="efectivo">Efectivo</option><option value="debito">Débito</option><option value="credito">Crédito</option><option value="transferencia">Transferencia</option>
                </select>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Guardando...' : (isEditing ? 'Actualizar Gasto' : 'Guardar Gasto')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Pasos para Ingreso */}
              <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <label>¿De cuánto fue el ingreso?</label>
                <input type="number" name="amount" placeholder="0.00" value={formData.amount} onChange={handleInputChange} required />
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                <label>¿Cuál es el concepto?</label>
                <input type="text" name="description" placeholder="Ej: Salario quincenal" value={formData.description} onChange={handleInputChange} required />
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                <label>Elige la categoría del ingreso</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Selecciona...</option><option value="salario">Salario</option><option value="ventas">Ventas</option><option value="regalo">Regalo</option><option value="otros">Otros</option>
                </select>
                <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
              </div>
              <div className={`form-step ${step === 4 ? 'active' : ''}`}>
                <label>¿A qué cuenta llegó el dinero?</label>
                <select name="account" value={formData.account} onChange={handleInputChange} required>
                    <option value="">Selecciona...</option><option value="efectivo">Efectivo</option><option value="cuenta_principal">Cuenta Principal (Débito)</option><option value="transferencia">Transferencia</option>
                </select>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Guardando...' : (isEditing ? 'Actualizar Ingreso' : 'Guardar Ingreso')}
                </button>
              </div>
            </>
          )}
        </form>
        <div className="modal-nav-buttons">
          {step > 1 && <button type="button" className="btn-secondary" onClick={prevStep}>Atrás</button>}
          <button type="button" className="btn-secondary" onClick={resetAndClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;

