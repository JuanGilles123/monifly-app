import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/monifly-logo.png';
import './AuthPages.css';

const UpdatePasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = Object.fromEntries(new FormData(e.target));

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } else {
      setMessage('¡Contraseña actualizada con éxito! Redirigiendo a inicio de sesión...');
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <img src={logo} alt="MoniFly Logo" className="logo-img" />
        <h2>Crea tu Nueva Contraseña</h2>
        
        <div className="message-container">
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
        </div>

        <form onSubmit={handleUpdatePassword} className="auth-form">
          <input name="password" type="password" placeholder="Nueva contraseña" required />
          <input name="confirmPassword" type="password" placeholder="Confirmar nueva contraseña" required />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
