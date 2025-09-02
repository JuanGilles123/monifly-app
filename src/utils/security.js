// src/utils/security.js
// Utilidades de seguridad para prevenir ataques automatizados

// SEGURIDAD: Detectar comportamiento de bot
export const detectBotBehavior = () => {
  const indicators = {
    // Tiempo de carga muy rápido
    fastLoad: performance.timing.loadEventEnd - performance.timing.navigationStart < 1000,
    
    // Sin eventos de mouse
    noMouseActivity: !window.hasMouseActivity,
    
    // Navegador sin plugins
    noPlugins: navigator.plugins.length === 0,
    
    // WebDriver presente
    isWebDriver: navigator.webdriver,
    
    // Pantalla muy pequeña (posible headless)
    tinyScreen: window.screen && (window.screen.width < 100 || window.screen.height < 100),
    
    // Sin historial del navegador
    noHistory: window.history && window.history.length <= 1,
  };

  const suspiciousCount = Object.values(indicators).filter(Boolean).length;
  return suspiciousCount >= 2; // Sospechoso si tiene 2+ indicadores
};

// SEGURIDAD: Generar token de sesión para validar formularios
export const generateFormToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};

// SEGURIDAD: Validar token de formulario
export const validateFormToken = (token) => {
  if (!token) return false;
  
  // Extraer timestamp del token
  const parts = token.split(/[a-z]+/);
  const timestamp = parts[parts.length - 1];
  
  if (!timestamp) return false;
  
  const tokenTime = parseInt(timestamp, 36);
  const now = Date.now();
  
  // Token válido si tiene menos de 1 hora
  return (now - tokenTime) < 3600000;
};

// SEGURIDAD: Configurar listeners para detectar actividad humana
export const initHumanActivityDetection = () => {
  let mouseActivityDetected = false;
  let keyboardActivityDetected = false;
  
  const markMouseActivity = () => {
    mouseActivityDetected = true;
    window.hasMouseActivity = true;
  };
  
  const markKeyboardActivity = () => {
    keyboardActivityDetected = true;
    window.hasKeyboardActivity = true;
  };
  
  // Listeners para detectar actividad humana
  document.addEventListener('mousemove', markMouseActivity, { once: true });
  document.addEventListener('click', markMouseActivity, { once: true });
  document.addEventListener('keydown', markKeyboardActivity, { once: true });
  document.addEventListener('keyup', markKeyboardActivity, { once: true });
  
  // Verificar después de 5 segundos
  setTimeout(() => {
    if (!mouseActivityDetected && !keyboardActivityDetected) {
      console.warn('⚠️ Posible comportamiento automatizado detectado');
    }
  }, 5000);
};

// SEGURIDAD: Ofuscar errores para no dar información a atacantes
export const sanitizeError = (error) => {
  const dangerousKeywords = [
    'database', 'sql', 'connection', 'server', 'internal',
    'stack', 'trace', 'debug', 'dev', 'localhost'
  ];
  
  let sanitizedMessage = error.message || error.toString();
  
  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitizedMessage = sanitizedMessage.replace(regex, '[FILTERED]');
  });
  
  return sanitizedMessage;
};

// SEGURIDAD: Rate limiting local
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 15 minutos por defecto
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isRateLimited(key) {
    const attempts = JSON.parse(localStorage.getItem(`rate_${key}`) || '[]');
    const now = Date.now();
    
    // Filtrar intentos dentro de la ventana de tiempo
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    // Actualizar localStorage
    localStorage.setItem(`rate_${key}`, JSON.stringify(validAttempts));
    
    return validAttempts.length >= this.maxAttempts;
  }
  
  recordAttempt(key) {
    const attempts = JSON.parse(localStorage.getItem(`rate_${key}`) || '[]');
    attempts.push(Date.now());
    localStorage.setItem(`rate_${key}`, JSON.stringify(attempts));
  }
  
  reset(key) {
    localStorage.removeItem(`rate_${key}`);
  }
}

// SEGURIDAD: Honeypot para detectar bots
export const createHoneypot = () => {
  const honeypot = document.createElement('input');
  honeypot.style.display = 'none';
  honeypot.style.position = 'absolute';
  honeypot.style.left = '-9999px';
  honeypot.name = 'website'; // Nombre que los bots podrían llenar
  honeypot.tabIndex = -1;
  honeypot.autoComplete = 'off';
  
  return honeypot;
};

// SEGURIDAD: Verificar si el honeypot fue llenado (indica bot)
export const checkHoneypot = (formData) => {
  return formData.get('website') !== null && formData.get('website') !== '';
};
