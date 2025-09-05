import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './WelcomeModal.css';

const WelcomeModal = ({ isOpen, onClose, session, isDarkMode }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    {
      id: 'welcome',
      title: '¡Bienvenido a las nuevas funciones!',
      subtitle: 'Descubre todo lo que hemos agregado para ti',
      content: (
        <div className="welcome-slide">
          <div className="welcome-icon">
            <div className="money-icon">💰</div>
            <div className="sparkles">✨</div>
          </div>
          <p>Hemos agregado increíbles nuevas funcionalidades para hacer tu experiencia financiera aún mejor.</p>
        </div>
      )
    },
    {
      id: 'streaks',
      title: 'Sistema de Rachas',
      subtitle: 'Mantén tu hábito financiero activo',
      content: (
        <div className="feature-slide streaks-slide">
          <div className="feature-icon streak-demo">
            <div className="streak-counter-demo">
              <span className="streak-number">7</span>
              <span className="streak-text">días</span>
            </div>
            <div className="streak-particles">
              <div className="particle">💫</div>
              <div className="particle">⭐</div>
              <div className="particle">🔥</div>
            </div>
          </div>
          <div className="feature-description">
            <p>¡Cada día que registres un ingreso o gasto mantienes tu racha activa!</p>
            <p>Colecciona días consecutivos y desbloquea animaciones especiales.</p>
            <div className="feature-benefits">
              <div className="benefit">🎯 Crea hábitos financieros</div>
              <div className="benefit">🏆 Animaciones de logros</div>
              <div className="benefit">📈 Seguimiento diario</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Sistema de Metas',
      subtitle: 'Alcanza tus objetivos financieros',
      content: (
        <div className="feature-slide goals-slide">
          <div className="feature-icon goals-demo">
            <div className="goal-progress-demo">
              <div className="goal-title">Casa propia</div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <div className="goal-amount">$45,000 / $100,000</div>
            </div>
            <div className="goal-icons">
              <div className="goal-icon">🏠</div>
              <div className="goal-icon">🚗</div>
              <div className="goal-icon">✈️</div>
            </div>
          </div>
          <div className="feature-description">
            <p>Define metas de ahorro y haz seguimiento de tu progreso en tiempo real.</p>
            <p>Organiza tus objetivos y mantente motivado con indicadores visuales.</p>
            <div className="feature-benefits">
              <div className="benefit">🎯 Metas personalizables</div>
              <div className="benefit">📊 Seguimiento visual</div>
              <div className="benefit">💡 Recordatorios inteligentes</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ready',
      title: '¡Estás listo para comenzar!',
      subtitle: 'Empieza a usar las nuevas funciones',
      content: (
        <div className="ready-slide">
          <div className="ready-icon">
            <div className="check-animation">✓</div>
          </div>
          <p>Todas las nuevas funciones están disponibles en tu dashboard.</p>
          <p className="ready-encouragement">¡Comienza tu primera racha registrando una transacción hoy!</p>
          <div className="quick-actions">
            <div className="quick-action">
              <span className="action-icon">💰</span>
              <span>Agregar transacción</span>
            </div>
            <div className="quick-action">
              <span className="action-icon">🎯</span>
              <span>Crear primera meta</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [isOpen]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleClose = async () => {
    // Marcar que el usuario ya vió el welcome
    if (session?.user?.id) {
      await supabase
        .from('profiles')
        .update({ 
          has_seen_welcome: true,
          welcome_seen_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
    }
    onClose();
  };

  const skipToEnd = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(slides.length - 1);
      setIsAnimating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`welcome-modal-overlay ${isDarkMode ? 'dark' : ''}`}>
      <div className="welcome-modal">
        <div className="welcome-header">
          <button className="skip-button" onClick={skipToEnd}>
            Saltar
          </button>
          <div className="slide-indicator">
            {slides.map((_, index) => (
              <div 
                key={index}
                className={`indicator-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={`welcome-content ${isAnimating ? 'animating' : ''}`}>
          <div className="slide-header">
            <h2 className="slide-title">{currentSlideData.title}</h2>
            <p className="slide-subtitle">{currentSlideData.subtitle}</p>
          </div>
          
          <div className="slide-body">
            {currentSlideData.content}
          </div>
        </div>

        <div className="welcome-navigation">
          <button 
            className="nav-button prev"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            Anterior
          </button>
          
          {currentSlide === slides.length - 1 ? (
            <button className="nav-button finish" onClick={handleClose}>
              ¡Comenzar!
            </button>
          ) : (
            <button className="nav-button next" onClick={nextSlide}>
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
