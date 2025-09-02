// src/pages/LoginPage.js
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import logo from '../assets/monifly-logo.png';
import { Link } from 'react-router-dom';
import './AuthStyles.css';

// Si prefieres traerlo desde supabaseClient, expórtalo allí como SITE_URL.
// Aquí lo resolvemos directo por si acaso:
const SITE_URL = process.env.REACT_APP_SITE_URL || window.location.origin;

/* ------------------------ LOGIN ------------------------ */
const LoginForm = ({ setIsLoading, setIsRegistering }) => {
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // SEGURIDAD: Rate limiting
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);

  // SEGURIDAD: Verificar si está bloqueado
  useEffect(() => {
    const checkBlock = () => {
      const blockUntil = localStorage.getItem('blockUntil');
      if (blockUntil && Date.now() < parseInt(blockUntil)) {
        setIsBlocked(true);
        setBlockTime(Math.ceil((parseInt(blockUntil) - Date.now()) / 1000));
      } else {
        setIsBlocked(false);
        setBlockTime(0);
        localStorage.removeItem('blockUntil');
      }
    };

    checkBlock();
    const interval = setInterval(checkBlock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    // SEGURIDAD: Verificar si está bloqueado
    if (isBlocked) {
      setError(`Demasiados intentos. Intenta en ${blockTime} segundos.`);
      return;
    }

    const { email, password } = Object.fromEntries(new FormData(e.target));
    
    // SEGURIDAD: Validaciones más estrictas
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError('Por favor, ingresa un formato de correo válido.');
    }
    
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    // SEGURIDAD: Detectar patrones de bot
    const formFillTime = Date.now() - (window.formStartTime || Date.now());
    if (formFillTime < 2000) { // Menos de 2 segundos es sospechoso
      setError('Por favor, tómate tu tiempo para llenar el formulario.');
      return;
    }

    setIsLoading(true);
    
    // SEGURIDAD: Delay artificial para prevenir ataques de fuerza bruta
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // SEGURIDAD: Incrementar contador de intentos
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        // SEGURIDAD: Bloquear después de 3 intentos
        if (newAttemptCount >= 3) {
          const blockUntil = Date.now() + (Math.pow(2, newAttemptCount - 3) * 60000); // Exponential backoff
          localStorage.setItem('blockUntil', blockUntil.toString());
          setIsBlocked(true);
          setError(`Demasiados intentos fallidos. Bloqueado por ${Math.ceil((blockUntil - Date.now()) / 60000)} minutos.`);
        } else {
          setError(`Credenciales inválidas. Intentos restantes: ${3 - newAttemptCount}`);
        }
      } else {
        // SEGURIDAD: Resetear contador en login exitoso
        setAttemptCount(0);
        localStorage.removeItem('blockUntil');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta más tarde.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // SEGURIDAD: Registrar cuando el usuario empieza a llenar el formulario
  const handleFormFocus = () => {
    if (!window.formStartTime) {
      window.formStartTime = Date.now();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="form-wrapper active">
      <img src={logo} alt="MoniFly Logo" className="logo-img" />
      <h2>Organiza tus finanzas y vuela ligero.</h2>

      <div className="message-container">
        {error && <p className="error-message">{error}</p>}
      </div>

      <form ref={formRef} onSubmit={handleLogin} className="login-form" autoComplete="off">
        <input 
          name="email" 
          type="email" 
          placeholder="Correo electrónico" 
          required 
          autoComplete="email"
          onFocus={handleFormFocus}
          disabled={isBlocked}
        />
        <div className="password-input-container">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            required
            autoComplete="current-password"
            onKeyDown={handleKeyDown}
            onFocus={handleFormFocus}
            disabled={isBlocked}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
        <button type="submit" className="submit-button" disabled={isBlocked}>
          {isBlocked ? `Bloqueado (${blockTime}s)` : 'Ingresar'}
        </button>
      </form>

      <div className="login-links">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        <button
          type="button"
          className="link-button"
          onClick={(e) => {
            e.preventDefault();
            setIsRegistering(true);
          }}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  );
};

/* ------------------------ REGISTRO ------------------------ */
const RegisterForm = ({ setIsLoading, setIsRegistering }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: 'CO' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // SEGURIDAD: Rate limiting para registro
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const [isRegistrationBlocked, setIsRegistrationBlocked] = useState(false);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (step === 1) nameInputRef.current?.focus();
    if (step === 2) emailInputRef.current?.focus();
    if (step === 3) passwordInputRef.current?.focus();
  }, [step]);

  // SEGURIDAD: Verificar bloqueo de registro
  useEffect(() => {
    const blockUntil = localStorage.getItem('registerBlockUntil');
    if (blockUntil && Date.now() < parseInt(blockUntil)) {
      setIsRegistrationBlocked(true);
    } else {
      setIsRegistrationBlocked(false);
      localStorage.removeItem('registerBlockUntil');
    }
  }, []);

  const handleInputChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
  const nextStep = (e) => {
    e.preventDefault();
    if (step === 2 && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      return setError('Por favor, ingresa un formato de correo válido.');
    }
    if (step === 3 && formData.password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }
    setError(null);
    setStep((s) => s + 1);
  };
  
  const prevStep = () => setStep((s) => s - 1);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // SEGURIDAD: Verificar si está bloqueado
    if (isRegistrationBlocked) {
      setError('Demasiados intentos de registro. Intenta más tarde.');
      return;
    }

    // SEGURIDAD: Validaciones adicionales
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('La contraseña debe contener al menos una mayúscula, una minúscula y un número.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    // SEGURIDAD: Delay artificial
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Metadatos para que el TRIGGER cree el perfil automáticamente
          data: {
            full_name: formData.name,
            country_code: formData.country,
          },
          // Para flujos de email (confirmación/reset), vuelve al front:
          emailRedirectTo: `${SITE_URL}/update-password`,
        },
      });

      if (error) {
        // SEGURIDAD: Incrementar contador
        const newAttempts = registrationAttempts + 1;
        setRegistrationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          const blockUntil = Date.now() + (10 * 60000); // 10 minutos
          localStorage.setItem('registerBlockUntil', blockUntil.toString());
          setIsRegistrationBlocked(true);
          setError('Demasiados intentos de registro. Intenta en 10 minutos.');
        } else {
          setError(error.message);
        }
      } else {
        // ¡Importante!: NO insertes en 'profiles' desde el cliente.
        // El trigger 'handle_new_user' creará el perfil con estos metadatos.
        setMessage('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
        setTimeout(() => setIsRegistering(false), 2500);
      }
    } catch (err) {
      console.error('Error durante el registro:', err);
      setError('No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action(e);
    }
  };

  return (
    <div className="form-wrapper active">
      <img src={logo} alt="MoniFly Logo" className="logo-img" />
      <h2>Crea tu cuenta en MoniFly</h2>

      <div className="message-container">
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
      </div>

      <form className="multi-step-form" onSubmit={handleRegister} autoComplete="off">
        <div className={`form-step ${step === 1 ? 'active' : ''}`}>
          <label>¿Cómo te llamas?</label>
          <input
            ref={nameInputRef}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            autoComplete="name"
            onKeyDown={(e) => handleKeyDown(e, nextStep)}
          />
          <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
        </div>

        <div className={`form-step ${step === 2 ? 'active' : ''}`}>
          <label>Ingresa tu correo</label>
          <input
            ref={emailInputRef}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            autoComplete="email"
            onKeyDown={(e) => handleKeyDown(e, nextStep)}
          />
          <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
        </div>

        <div className={`form-step ${step === 3 ? 'active' : ''}`}>
          <label>Crea una contraseña segura</label>
          <div className="password-input-container">
            <input
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
              onKeyDown={(e) => handleKeyDown(e, nextStep)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
          <small className="input-hint">Mínimo 6 caracteres</small>
          <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
        </div>

        <div className={`form-step ${step === 4 ? 'active' : ''}`}>
          <label>¿Cuál es tu país?</label>
          <select name="country" value={formData.country} onChange={handleInputChange}>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="ES">España</option>
            <option value="US">Estados Unidos</option>
          </select>
          <button type="submit" className="submit-button">Finalizar Registro</button>
        </div>
      </form>

      <div className="modal-nav-buttons">
        {step > 1 && (
          <button type="button" className="btn-secondary" onClick={prevStep}>
            Atrás
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setIsRegistering(false);
            setError(null);
            setMessage(null);
          }}
        >
          {step === 1 ? '¿Ya tienes cuenta?' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------ PÁGINA PRINCIPAL ------------------------ */
const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="form-flipper">
            {isRegistering ? (
              <RegisterForm setIsLoading={setIsLoading} setIsRegistering={setIsRegistering} />
            ) : (
              <LoginForm setIsLoading={setIsLoading} setIsRegistering={setIsRegistering} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
