// src/App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { initHumanActivityDetection, detectBotBehavior } from './utils/security';
import { setupThemeListener } from './utils/themeUtils';

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

  // SEGURIDAD: Inicializar protecciones al cargar la app
  useEffect(() => {
    // Detectar actividad humana
    initHumanActivityDetection();
    
    // Configurar listener para cambios de tema (favicon dinámico)
    const cleanupThemeListener = setupThemeListener();
    
    // Verificar comportamiento de bot
    setTimeout(() => {
      if (detectBotBehavior()) {
        console.warn('🤖 Comportamiento sospechoso detectado');
        // Podrías redirigir o mostrar un captcha aquí
      }
    }, 2000);

    // Cleanup function
    return () => {
      cleanupThemeListener();
    };
  }, []);

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
      console.log('🔄 Auth state change:', event, sess?.user?.email || 'no user');
      setSession(sess ?? null);

      switch (event) {
        case 'PASSWORD_RECOVERY':
          // siempre permitir llegar a /update-password
          console.log('🔑 Redirecting to password recovery');
          navigate('/update-password', { replace: true });
          break;

        case 'SIGNED_IN':
          // si viene desde login o forgot, mándalo al dashboard
          console.log('✅ User signed in, current path:', location.pathname);
          if (location.pathname === '/login' || location.pathname === '/forgot-password') {
            navigate('/', { replace: true });
          }
          // OJO: NO redirigir si está en /update-password
          break;

        case 'SIGNED_OUT':
          console.log('🚪 User signed out, redirecting to login');
          navigate('/login', { replace: true });
          break;

        default:
          console.log('🔄 Auth event:', event);
          break;
      }
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistencia y atributo del tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  if (loading) return <div className="loading-fullscreen">Cargando...</div>;

  // Guards
  const Protected = ({ children }) => (session ? children : <Navigate to="/login" replace />);
  const PublicOnly = ({ children }) => (session ? <Navigate to="/" replace /> : children);

  return (
    <div className="App">
      {session && <Navbar />}

      <Routes>
        {/* Públicas */}
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

        {/* ⚠️ /update-password SIN PublicOnly para no expulsar al usuario */}
        <Route path="/update-password" element={<UpdatePasswordPage />} />

        {/* Protegidas */}
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
