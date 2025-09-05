import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import StreakAnimation from './StreakAnimation';
import './StreakCounter.css';

const StreakCounter = ({ userId, onStreakUpdate, isDarkMode }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [streakLevel, setStreakLevel] = useState('basic');
  const [lastActivityDate, setLastActivityDate] = useState(null);
  const [hasShownAnimationToday, setHasShownAnimationToday] = useState(false);

  // Determinar el nivel de racha y símbolo
  const getStreakInfo = (days) => {
    if (days >= 100) {
      return { level: 'legendary', symbol: '👑', color: '#FFD700', title: 'Legendario' };
    } else if (days >= 30) {
      return { level: 'golden', symbol: '⭐', color: '#FFA500', title: 'Dorado' };
    } else if (days >= 7) {
      return { level: 'solid', symbol: '💎', color: '#00BFFF', title: 'Sólido' };
    } else {
      return { level: 'basic', symbol: '🌱', color: '#22c55e', title: 'Creciendo' };
    }
  };

  const streakInfo = getStreakInfo(currentStreak);

  // Cargar racha actual del usuario
  useEffect(() => {
    if (!userId) return;
    
    const loadStreak = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('current_streak, last_activity_date')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (profile) {
          const today = new Date().toDateString();
          const lastActivity = profile.last_activity_date ? new Date(profile.last_activity_date).toDateString() : null;
          
          // Si hay actividad hoy, marcar que ya se mostró la animación
          if (lastActivity === today) {
            setHasShownAnimationToday(true);
            setCurrentStreak(profile.current_streak || 0);
          } else {
            setHasShownAnimationToday(false);
            // Si fue hace más de 1 día, resetear racha
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            if (lastActivity === yesterday) {
              setCurrentStreak(profile.current_streak || 0);
            } else {
              setCurrentStreak(0);
              // NO actualizar en DB aquí, solo al incrementar
            }
          }
          
          setLastActivityDate(profile.last_activity_date);
        }
      } catch (error) {
        console.error('Error loading streak:', error);
      }
    };

    loadStreak();
  }, [userId]);

  // Actualizar racha en la base de datos
  const updateStreakInDB = async (newStreak) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          last_activity_date: new Date().toISOString(),
          max_streak: newStreak // También actualizar max_streak si es mayor
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Incrementar racha cuando hay nueva actividad
  const incrementStreak = async () => {
    const today = new Date().toDateString();
    const lastActivity = lastActivityDate ? new Date(lastActivityDate).toDateString() : null;

    // Incrementar si no hay actividad hoy Y no hemos mostrado animación hoy
    if (lastActivity !== today && !hasShownAnimationToday) {
      const newStreak = currentStreak + 1;
      
      setCurrentStreak(newStreak);
      setLastActivityDate(new Date().toISOString());
      setHasShownAnimationToday(true);
      
      // Mostrar animación
      setShowAnimation(true);
      
      // Actualizar en base de datos
      await updateStreakInDB(newStreak);
      
      // Callback para notificar al componente padre
      if (onStreakUpdate) {
        onStreakUpdate(newStreak);
      }
    }
  };

  // Función temporal para pruebas - resetear la animación del día
  const resetDailyAnimation = () => {
    setHasShownAnimationToday(false);
  };

  // Exponer función para que otros componentes puedan incrementar la racha
  useEffect(() => {
    window.incrementStreak = incrementStreak;
    window.resetDailyAnimation = resetDailyAnimation; // Para pruebas
    return () => {
      delete window.incrementStreak;
      delete window.resetDailyAnimation;
    };
  }, [currentStreak, lastActivityDate, hasShownAnimationToday]);

  const handleStreakClick = () => {
    // Mostrar detalles de la racha o estadísticas
    // Por ahora solo un console.log, luego puedes agregar un modal
  };

  return (
    <div className={`streak-counter ${isDarkMode ? 'dark' : 'light'}`} onClick={handleStreakClick}>
      <div className={`streak-display ${streakInfo.level}`}>
        <div className="streak-symbol" style={{ color: streakInfo.color }}>
          {streakInfo.symbol}
        </div>
        <div className="streak-info">
          <div className="streak-number">{currentStreak}</div>
          <div className="streak-label">días</div>
        </div>
      </div>
      
      {/* Animación cuando incrementa la racha */}
      <StreakAnimation 
        show={showAnimation} 
        streakCount={currentStreak}
        level={streakInfo.level}
        symbol={streakInfo.symbol}
        color={streakInfo.color}
        isDarkMode={isDarkMode}
        onComplete={() => {
          setShowAnimation(false);
        }}
      />
    </div>
  );
};

export default StreakCounter;
