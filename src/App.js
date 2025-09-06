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
import GoalsPage from './pages/GoalsPage';
import DebtPage from './pages/DebtPage';
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
      try {
        const { data, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.error('❌ Error getting session:', error);
            setSession(null);
          } else {
            setSession(data.session ?? null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Unexpected error getting session:', err);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('🔄 Auth state change:', event, sess?.user?.email || 'no user');
      
      // Validar que la sesión es válida antes de setearla
      if (sess && sess.access_token && sess.user) {
        setSession(sess);
      } else {
        setSession(null);
      }

      switch (event) {
        case 'PASSWORD_RECOVERY':
          console.log('🔑 Redirecting to password recovery');
          navigate('/update-password', { replace: true });
          break;

        case 'SIGNED_IN':
          console.log('✅ User signed in, current path:', location.pathname);
          if (location.pathname === '/login' || location.pathname === '/forgot-password') {
            navigate('/', { replace: true });
          }
          break;

        case 'SIGNED_OUT':
          console.log('🚪 User signed out, redirecting to login');
          // Limpiar estado local
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { replace: true });
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed');
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
        <Route
          path="/goals"
          element={
            <Protected>
              <GoalsPage session={session} isDarkMode={isDarkMode} />
            </Protected>
          }
        />
        <Route
          path="/debts"
          element={
            <Protected>
              <DebtPage session={session} isDarkMode={isDarkMode} />
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
