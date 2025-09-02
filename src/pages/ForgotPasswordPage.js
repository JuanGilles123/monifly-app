// src/pages/ForgotPasswordPage.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// Si exportaste SITE_URL desde supabaseClient, descomenta la siguiente línea y usa SITE_URL.
// import { SITE_URL } from '../supabaseClient';
import { Link } from 'react-router-dom';
import logo from '../assets/monifly-logo.png';
import './AuthStyles.css';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // SEGURIDAD: Rate limiting para reset de password
  const [resetAttempts, setResetAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastResetTime, setLastResetTime] = useState(0);

  // Usa el dominio del front desde env; cae a window.location.origin si falta.
  // En tu DO ya tienes REACT_APP_SITE_URL = https://monifly.app
  const siteUrl = process.env.REACT_APP_SITE_URL || window.location.origin;

  // SEGURIDAD: Verificar bloqueo al montar
  useEffect(() => {
    const blockUntil = localStorage.getItem('resetBlockUntil');
    if (blockUntil && Date.now() < parseInt(blockUntil)) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
      localStorage.removeItem('resetBlockUntil');
    }
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // SEGURIDAD: Verificar si está bloqueado
    if (isBlocked) {
      setError('Demasiados intentos. Intenta más tarde.');
      return;
    }

    // SEGURIDAD: Rate limiting por tiempo (máximo 1 cada 60 segundos)
    const now = Date.now();
    if (now - lastResetTime < 60000) {
      setError('Por favor espera 60 segundos antes de intentar de nuevo.');
      return;
    }

    const { email } = Object.fromEntries(new FormData(e.target));

    // Validación básica de email
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError('Por favor ingresa un correo válido.');
    }

    setLoading(true);
    setError('');
    setMessage('');

    // SEGURIDAD: Delay artificial
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/update-password`,
    });

    if (error) {
      // SEGURIDAD: Incrementar contador
      const newAttempts = resetAttempts + 1;
      setResetAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const blockUntil = Date.now() + (15 * 60000); // 15 minutos
        localStorage.setItem('resetBlockUntil', blockUntil.toString());
        setIsBlocked(true);
        setError('Demasiados intentos. Bloqueado por 15 minutos.');
      } else {
        setError('No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.');
      }
    } else {
      setMessage('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      setLastResetTime(now);
      setResetAttempts(0); // Reset en éxito
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
          <input 
            name="email" 
            type="email" 
            placeholder="Tu correo electrónico" 
            required 
            disabled={isBlocked || loading}
          />
          <button type="submit" className="submit-button" disabled={loading || isBlocked}>
            {loading ? 'Enviando...' : (isBlocked ? 'Bloqueado' : 'Enviar Enlace')}
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
