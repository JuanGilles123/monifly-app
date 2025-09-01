import React from 'react';
import './ProfilePage.css';

// Por ahora usaremos datos de ejemplo
const userData = {
  name: 'Juan',
  email: 'juan@monifly.app',
  memberSince: 'Septiembre 2025',
};

const ProfilePage = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div className="profile-container">
      <h1>Mi Perfil</h1>

      <div className="profile-card">
        <div className="profile-avatar">
          <span>{userData.name.charAt(0)}</span>
        </div>
        <h2>{userData.name}</h2>
        <p>{userData.email}</p>
        <span className="member-since">Miembro desde {userData.memberSince}</span>
      </div>

      <div className="settings-card">
        <h3>Configuración</h3>
        
        <div className="setting-item">
          <label htmlFor="name">Nombre</label>
          <input type="text" id="name" defaultValue={userData.name} />
        </div>

        <div className="setting-item">
          <label htmlFor="email">Correo Electrónico</label>
          <input type="email" id="email" defaultValue={userData.email} />
        </div>
        
        <button className="save-button">Guardar Cambios</button>
      </div>

      <div className="settings-card">
        <h3>Apariencia</h3>
        <div className="setting-item dark-mode-toggle">
          <label htmlFor="darkMode">Modo Oscuro</label>
          <label className="switch">
            <input type="checkbox" id="darkMode" checked={isDarkMode} onChange={toggleDarkMode} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;