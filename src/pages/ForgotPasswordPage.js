// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
// Si exportaste SITE_URL desde supabaseClient, descomenta la siguiente línea y usa SITE_URL.
// import { SITE_URL } from '../supabaseClient';
import { Link } from 'react-router-dom';
import logo from '../assets/monifly-logo.png';
import './AuthPages.css';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Usa el dominio del front desde env; cae a window.location.origin si falta.
  // En tu DO ya tienes REACT_APP_SITE_URL = https://monifly.app
  const siteUrl = process.env.REACT_APP_SITE_URL || window.location.origin;

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const { email } = Object.fromEntries(new FormData(e.target));

    // Validación básica de email
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError('Por favor ingresa un correo válido.');
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/update-password`,
    });

    if (error) {
      setError('No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.');
    } else {
      setMessage('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <img src={logo} alt="MoniFly Logo" className="logo-img" />
        <h2>Restablecer Contraseña</h2>
        <p className="auth-subtitle">Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.</p>

        <div className="message-container">
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
        </div>

        <form onSubmit={handlePasswordReset} className="auth-form" autoComplete="off">
          <input name="email" type="email" placeholder="Tu correo electrónico" required />
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver a Inicio de Sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
