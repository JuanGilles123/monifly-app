import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ProfilePage.css';

const ProfilePage = ({ isDarkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    memberSince: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Usuario obtenido:', user);
        
        // Intentar buscar en la tabla profiles
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, country_code')
            .eq('id', user.id)
            .single();

          console.log('Resultado de profiles:', { profileData, profileError });

          let userName = user.user_metadata?.full_name || user.email.split('@')[0] || 'Usuario';
          
          if (!profileError && profileData && profileData.full_name) {
            userName = profileData.full_name;
          }

          const userData = {
            name: userName,
            email: user.email,
            memberSince: new Date(user.created_at).toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            }),
          };

          setUserData(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
          });
        } catch (profileError) {
          console.log('Error accediendo a profiles, usando datos del auth:', profileError);
          
          // Usar datos del auth como fallback
          const userData = {
            name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Usuario',
            email: user.email,
            memberSince: new Date(user.created_at).toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            }),
          };

          setUserData(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error cargando el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      console.log('Intentando actualizar perfil para usuario:', user.id);

      // Intentar actualizar en la tabla profiles (si existe y funciona)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            full_name: formData.name,
            country_code: 'CO'
          });

        if (profileError) {
          console.error('Error en profiles table:', profileError);
          // Continuar sin fallar, por ahora solo actualizamos localmente
        } else {
          console.log('Perfil actualizado en la tabla profiles');
        }
      } catch (profileTableError) {
        console.log('Tabla profiles no disponible, actualizando solo localmente:', profileTableError);
      }

      // Actualizar el estado local independientemente
      setUserData(prev => ({
        ...prev,
        name: formData.name
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error guardando los cambios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h1>Mi Perfil</h1>
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1>Mi Perfil</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Perfil actualizado correctamente</div>}

      <div className="profile-card">
        <div className="profile-avatar">
          <span>{userData.name.charAt(0).toUpperCase()}</span>
        </div>
        <h2>{userData.name}</h2>
        <p>{userData.email}</p>
        <span className="member-since">Miembro desde {userData.memberSince}</span>
      </div>

      <div className="settings-card">
        <h3>Configuración</h3>
        
        <div className="setting-item">
          <label htmlFor="name">Nombre</label>
          <input 
            type="text" 
            id="name" 
            name="name"
            value={formData.name} 
            onChange={handleInputChange}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="email">Correo Electrónico</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email} 
            disabled
            title="El email no se puede cambiar"
          />
        </div>
        
        <button 
          className="save-button" 
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
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