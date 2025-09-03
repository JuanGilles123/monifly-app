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
      
      // Realizar el sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
        return;
      }
      
      console.log('✅ Sesión cerrada exitosamente');
      
      // Limpiar localStorage por si acaso
      localStorage.removeItem('supabase.auth.token');
      
      // Forzar navegación inmediata
      navigate('/login', { replace: true });
      
    } catch (err) {
      console.error('❌ Error inesperado al cerrar sesión:', err);
      alert('Error inesperado al cerrar sesión');
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
