// src/App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import Navbar from './components/Navbar';

import './App.css';

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  const navigate = useNavigate();
  const location = useLocation();

  // Chequeo inicial de sesión + listener único
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (mounted) {
        if (!error) setSession(data.session ?? null);
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess ?? null);

      // Navegación según evento
      switch (event) {
        case 'PASSWORD_RECOVERY':
          // Al volver desde el correo (link con ?code=...), vamos a la página que canjea el code.
          navigate('/update-password', { replace: true });
          break;

        case 'SIGNED_IN':
          // Si llega desde login o desde confirmación, llévalo al dashboard
          if (location.pathname === '/login' || location.pathname === '/forgot-password' || location.pathname === '/update-password') {
            navigate('/', { replace: true });
          }
          break;

        case 'SIGNED_OUT':
          // En logout, regresa a login
          navigate('/login', { replace: true });
          break;

        case 'USER_UPDATED':
        default:
          // Sin navegación especial
          break;
      }
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // una sola vez al montar

  // Persistencia y atributo del tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  // Loader global mientras resolvemos la sesión inicial
  if (loading) {
    return <div className="loading-fullscreen">Cargando...</div>;
  }

  // Helpers de rutas
  const Protected = ({ children }) => (session ? children : <Navigate to="/login" replace />);
  const PublicOnly = ({ children }) => (session ? <Navigate to="/" replace /> : children);

  return (
    <div className="App">
      {session && <Navbar />}

      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnly>
              <ForgotPasswordPage />
            </PublicOnly>
          }
        />
        <Route
          path="/update-password"
          element={
            // Esta ruta puede llegar con sesión aún no creada (se crea en la propia página con exchangeCodeForSession)
            <PublicOnly>
              <UpdatePasswordPage />
            </PublicOnly>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <Protected>
              <DashboardPage session={session} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </Protected>
          }
        />
        <Route
          path="/analytics"
          element={
            <Protected>
              <AnalyticsPage session={session} isDarkMode={isDarkMode} />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePage session={session} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </Protected>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
