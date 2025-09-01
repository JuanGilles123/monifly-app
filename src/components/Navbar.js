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
    await supabase.auth.signOut();
    toggleMenu(); // Cierra el menú
    navigate('/login'); // Redirige al login
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
