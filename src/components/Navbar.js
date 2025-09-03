import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Importamos supabase
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Iniciando cierre de sesión...');
      
      // Cerrar el menú inmediatamente para feedback visual
      toggleMenu();
      
      // Verificar si hay sesión activa antes de intentar cerrar
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('⚠️ No hay sesión activa, limpiando estado local');
        
        // Si no hay sesión, simplemente limpiar todo localmente
        localStorage.clear();
        sessionStorage.clear();
        
        // Forzar navegación
        navigate('/login', { replace: true });
        return;
      }
      
      console.log('📝 Sesión encontrada, cerrando normalmente...');
      
      // Realizar el sign out solo si hay sesión
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error al cerrar sesión:', error);
        
        // Si es error de sesión faltante, limpiar localmente
        if (error.message.includes('Auth session missing') || error.message.includes('session missing')) {
          console.log('🧹 Limpiando sesión localmente debido a error de sesión');
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { replace: true });
          return;
        }
        
        // Para otros errores, mostrar mensaje
        alert('Error al cerrar sesión: ' + error.message);
        return;
      }
      
      console.log('✅ Sesión cerrada exitosamente');
      
      // Limpiar storage por seguridad
      localStorage.clear();
      sessionStorage.clear();
      
      // Forzar navegación inmediata
      navigate('/login', { replace: true });
      
    } catch (err) {
      console.error('❌ Error inesperado al cerrar sesión:', err);
      
      // En caso de error inesperado, limpiar todo y redirigir
      console.log('🧹 Limpiando todo debido a error inesperado');
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <button className="hamburger-menu" onClick={toggleMenu}>
        <div className={`line line-1 ${isOpen ? 'open' : ''}`}></div>
        <div className={`line line-2 ${isOpen ? 'open' : ''}`}></div>
        <div className={`line line-3 ${isOpen ? 'open' : ''}`}></div>
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav>
          <ul>
            <li onClick={toggleMenu}><Link to="/">Inicio</Link></li>
            <li onClick={toggleMenu}><Link to="/analytics">Análisis de Gastos</Link></li>
            <li onClick={toggleMenu}><Link to="/goals">Mis Metas</Link></li>
            <li onClick={toggleMenu}><Link to="/profile">Mi Perfil</Link></li>
            {/* --- NUEVO BOTÓN DE CERRAR SESIÓN --- */}
            <li>
              <button className="logout-button" onClick={handleSignOut}>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
