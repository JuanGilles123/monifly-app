import React, { useEffect, useState } from 'react';
import './TransactionAnimation.css';

const TransactionAnimation = ({ 
  show, 
  type, // 'income' o 'expense'
  amount, 
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [arrows, setArrows] = useState([]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generar más flechas distribuidas por toda la pantalla
      const newArrows = [];
      const arrowCount = window.innerWidth < 768 ? 12 : 16; // Más flechas en pantallas grandes
      
      for (let i = 0; i < arrowCount; i++) {
        newArrows.push({
          id: i,
          left: Math.random() * 90 + 5,   // Entre 5% y 95%
          top: Math.random() * 80 + 10,   // Entre 10% y 90%
          delay: Math.random() * 0.8,     // Delay aleatorio hasta 0.8s
          size: Math.random() * 0.6 + 0.8, // Entre 0.8 y 1.4 de tamaño
          duration: 1.5 + Math.random() * 1 // Duración entre 1.5s y 2.5s
        });
      }
      setArrows(newArrows);
      
      // Ocultar después de la animación
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete && onComplete();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isVisible) return null;

  const isIncome = type === 'income';
  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
  };

  return (
    <div className={`transaction-animation ${isVisible ? 'show' : 'hide'}`}>
      {/* Overlay oscuro */}
      <div className="animation-overlay" />
      
      {/* Contenedor de animación que llena toda la pantalla */}
      <div className="animation-container">
        {/* Círculo central */}
        <div className={`animation-circle ${isIncome ? 'income' : 'expense'}`}>
          <div className="amount-display">
            {isIncome ? '+' : '-'}{formatAmount(amount)}
          </div>
          <div className="transaction-icon">
            {isIncome ? '💰' : '💸'}
          </div>
        </div>

        {/* Flechas animadas distribuidas por toda la pantalla */}
        {arrows.map(arrow => (
          <div
            key={arrow.id}
            className={`animated-arrow ${isIncome ? 'income' : 'expense'}`}
            style={{
              left: `${arrow.left}%`,
              top: `${arrow.top}%`,
              animationDelay: `${arrow.delay}s`,
              animationDuration: `${arrow.duration}s`,
              transform: `scale(${arrow.size}) ${isIncome ? 'rotate(-45deg)' : 'rotate(135deg)'}`
            }}
          >
            <div className="arrow-line"></div>
          </div>
        ))}

        {/* Partículas adicionales distribuidas */}
        <div className="particles-container">
          {Array.from({ length: window.innerWidth < 768 ? 15 : 20 }, (_, i) => {
            return (
              <div
                key={i}
                className={`particle ${isIncome ? 'income' : 'expense'}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  animationDuration: `${1.5 + Math.random() * 1}s`
                }}
              />
            );
          })}
        </div>

        {/* Texto descriptivo */}
        <div className="animation-text">
          {isIncome ? '¡Ingreso registrado!' : '¡Gasto registrado!'}
        </div>
      </div>
    </div>
  );
};

export default TransactionAnimation;
