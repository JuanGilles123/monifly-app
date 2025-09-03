// Script de prueba para simular ataques automatizados
// Ejecutar en la consola del navegador en https://monifly.app/login

console.log("🧪 Iniciando pruebas de seguridad...");

// Función para simular múltiples intentos de login automatizados
async function testBruteForceLogin() {
  console.log("🔴 Probando ataque de fuerza bruta en login...");
  
  for (let i = 1; i <= 5; i++) {
    console.log(`Intento ${i}/5`);
    
    // Simular llenado automático del formulario
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (emailInput && passwordInput) {
      emailInput.value = `test${i}@invalid.com`;
      passwordInput.value = `wrongpass${i}`;
      
      // Simular envío muy rápido (comportamiento de bot)
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
        
        // Esperar respuesta
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log("🛡️ BLOQUEADO - Las protecciones funcionan!");
        break;
      }
    }
  }
}

// Función para probar la detección de comportamiento de bot
function testBotDetection() {
  console.log("🤖 Probando detección de bots...");
  
  // Simular comportamiento de bot
  Object.defineProperty(navigator, 'webdriver', {
    get: () => true,
  });
  
  // Verificar si se detecta
  setTimeout(() => {
    console.log("Revisa la consola en busca de advertencias de comportamiento sospechoso");
  }, 3000);
}

// Función para probar honeypot
function testHoneypot() {
  console.log("🍯 Probando honeypot...");
  
  const form = document.querySelector('form');
  if (form) {
    // Buscar campo honeypot oculto
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot) {
      console.log("✅ Honeypot encontrado - Simulando bot llenándolo");
      honeypot.value = "http://bot-site.com";
    } else {
      console.log("❌ Honeypot no encontrado en este formulario");
    }
  }
}

// Ejecutar todas las pruebas
console.log("Para ejecutar las pruebas, usa:");
console.log("- testBruteForceLogin() // Prueba rate limiting");
console.log("- testBotDetection() // Prueba detección de bots"); 
console.log("- testHoneypot() // Prueba honeypot");
