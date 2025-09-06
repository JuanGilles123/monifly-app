import React, { useEffect, useState, useCallback } from 'react';
import './StreakAnimation.css';

const StreakAnimation = ({ 
  show, 
  streakCount, 
  level,
  symbol,
  color,
  isDarkMode,
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const handleComplete = useCallback(() => {
    if (onComplete) onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generar partículas según el nivel de racha
      const newParticles = [];
      const particleCount = level === 'legendary' ? 20 : level === 'golden' ? 15 : level === 'solid' ? 12 : 8;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 80 + 10,   // Entre 10% y 90%
          top: Math.random() * 80 + 10,    // Entre 10% y 90%
          delay: Math.random() * 0.8,      // Delay aleatorio
          size: Math.random() * 0.6 + 0.8, // Entre 0.8 y 1.4
          duration: 1.5 + Math.random() * 1 // Duración entre 1.5s y 2.5s
        });
      }
      setParticles(newParticles);
      
      // Ocultar después de la animación (tiempo fijo)
      const timer = setTimeout(() => {
        setIsVisible(false);
        handleComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // Si show es false, asegurar que isVisible también sea false
      setIsVisible(false);
    }
  }, [show, level, handleComplete]);

  if (!show && !isVisible) return null;

  // Mensajes según el nivel
  const getStreakMessage = () => {
    if (streakCount === 1) return '¡Primera racha!';
    if (streakCount === 7) return '¡Una semana completa!';
    if (streakCount === 30) return '¡Un mes increíble!';
    if (streakCount === 100) return '¡100 días! ¡Eres legendario!';
    if (streakCount % 10 === 0) return `¡${streakCount} días de constancia!`;
    return `¡${streakCount} días seguidos!`;
  };

  return (
    <div className={`streak-animation ${isVisible ? 'show' : 'hide'} ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Overlay */}
      <div className="streak-overlay" />
      
      {/* Contenedor principal */}
      <div className="streak-animation-container">
        {/* Círculo central con el símbolo */}
        <div className={`streak-circle ${level}`} style={{ borderColor: color }}>
          <div className="streak-symbol-large" style={{ color }}>
            {symbol}
          </div>
          <div className="streak-count-display">
            {streakCount}
          </div>
          <div className="streak-days-label">
            {streakCount === 1 ? 'día' : 'días'}
          </div>
        </div>

        {/* Partículas animadas */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`streak-particle ${level}`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `scale(${particle.size})`,
              color: color
            }}
          >
            {symbol}
          </div>
        ))}

        {/* Ondas de expansión */}
        <div className="streak-waves">
          <div className="streak-wave" style={{ borderColor: color }}></div>
          <div className="streak-wave" style={{ borderColor: color }}></div>
          <div className="streak-wave" style={{ borderColor: color }}></div>
        </div>

        {/* Texto de celebración */}
        <div className="streak-message">
          {getStreakMessage()}
        </div>

        {/* Efecto de confetti para niveles altos */}
        {(level === 'golden' || level === 'legendary') && (
          <div className="streak-confetti">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1}s`,
                  backgroundColor: i % 2 === 0 ? '#FFD700' : color
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakAnimation;
