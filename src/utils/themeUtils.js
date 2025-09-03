// Utilidades para manejo de temas claro/oscuro
export const detectColorScheme = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const updateFaviconForTheme = () => {
  const isDark = detectColorScheme();
  const favicon = document.querySelector('link[rel="icon"]');
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  
  if (favicon) {
    favicon.href = isDark ? '/favicon-dark.ico' : '/favicon.ico';
  }
  
  if (appleTouchIcon) {
    appleTouchIcon.href = isDark ? '/apple-touch-icon-dark.png' : '/apple-touch-icon.png';
  }
  
  // También actualizar los meta tags de color de tema
  const themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])');
  const msNavButtonColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
  
  if (themeColorMeta) {
    themeColorMeta.content = isDark ? '#121212' : '#f7f9fc';
  }
  
  if (msNavButtonColor) {
    msNavButtonColor.content = isDark ? '#121212' : '#f7f9fc';
  }
};

export const setupThemeListener = () => {
  // Configurar el favicon inicial
  updateFaviconForTheme();
  
  // Escuchar cambios en el tema
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFaviconForTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateFaviconForTheme);
    };
  }
  
  return () => {};
};
