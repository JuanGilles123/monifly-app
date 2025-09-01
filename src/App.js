import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import Navbar from './components/Navbar';
import { supabase } from './supabaseClient';
import './App.css';

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Listener #1: Para el evento de recuperación de contraseña
    const { data: { subscription: hashSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Este evento se dispara cuando el usuario vuelve del email
        if(event === 'PASSWORD_RECOVERY') {
            navigate('/update-password');
        }
    });

    // Verificamos la sesión al cargar la app por primera vez
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listener #2: Para eventos de login y logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && location.pathname === '/login') {
        navigate('/');
      }
    });

    // Limpiamos las suscripciones al desmontar el componente
    return () => {
        subscription.unsubscribe();
        hashSubscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Redirección si no hay sesión (solo para las rutas protegidas)
  useEffect(() => {
    const protectedRoutes = ['/', '/analytics', '/profile'];
    if (!loading && !session && protectedRoutes.includes(location.pathname)) {
      navigate('/login');
    }
  }, [session, loading, navigate, location.pathname]);
  
  const toggleDarkMode = () => setIsDarkMode(prevMode => !prevMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="App">
      {/* El Navbar solo se muestra si el usuario ha iniciado sesión */}
      {session && <Navbar />}
      <Routes>
        {/* --- Rutas Públicas (accesibles sin iniciar sesión) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />

        {/* --- Rutas Protegidas (requieren iniciar sesión) --- */}
        {/* Usamos 'session' como condición para renderizar estas rutas */}
        {session ? (
          <>
            <Route path="/" element={<DashboardPage session={session} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/analytics" element={<AnalyticsPage session={session} isDarkMode={isDarkMode} />} />
            <Route path="/profile" element={<ProfilePage session={session} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
          </>
        ) : (
          /* Mientras carga, podemos mostrar un loader general si se intenta acceder a una ruta protegida */
          loading ? <Route path="*" element={<div className="loading-fullscreen">Cargando...</div>} /> : null
        )}
      </Routes>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;

