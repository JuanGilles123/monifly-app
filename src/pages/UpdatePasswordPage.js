// src/pages/UpdatePasswordPage.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/monifly-logo.png';
import './AuthPages.css';

const UpdatePasswordPage = () => {
  const [booting, setBooting] = useState(true);   // prepara sesión desde el code
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 1) Al montar, canjea ?code=... por una sesión válida
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        // v2: Supabase usa ?code=... para password recovery
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('exchangeCodeForSession error', error);
            setError('Enlace inválido o expirado. Solicita uno nuevo.');
          }
        } else {
          // Si no hay code, verifica si ya existe sesión (usuario pudo venir logueado)
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error(error);
            setError('No hay sesión válida. Abre el enlace desde tu correo nuevamente.');
          } else if (!data?.session) {
            setError('No hay sesión válida. Abre el enlace desde tu correo nuevamente.');
          }
        }
      } catch (err) {
        console.error(err);
        setError('No fue posible validar el enlace. Intenta solicitar uno nuevo.');
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // 2) Enviar nueva contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = Object.fromEntries(new FormData(e.target));

    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error(error);
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } else {
      setMessage('¡Contraseña actualizada con éxito! Redirigiendo a inicio de sesión...');
      setTimeout(() => navigate('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <img src={logo} alt="MoniFly Logo" className="logo-img" />
        <h2>Crea tu Nueva Contraseña</h2>

        <div className="message-container">
          {booting && <p className="info-message">Validando enlace...</p>}
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
        </div>

        {!booting && !message && (
          <form onSubmit={handleUpdatePassword} className="auth-form">
            <input name="password" type="password" placeholder="Nueva contraseña" required minLength={6} />
            <input name="confirmPassword" type="password" placeholder="Confirmar nueva contraseña" required minLength={6} />
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
