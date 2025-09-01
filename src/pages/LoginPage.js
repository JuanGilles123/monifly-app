import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import logo from '../assets/monifly-logo.png';
import { Link } from 'react-router-dom';

// --- Componente de Login AHORA es INDEPENDIENTE ---
const LoginForm = ({ setIsLoading, setIsRegistering }) => {
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  // SOLUCIÓN: Estado para la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const { email, password } = Object.fromEntries(new FormData(e.target));
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError("Por favor, ingresa un formato de correo válido.");
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      formRef.current.requestSubmit();
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
        <input name="email" type="email" placeholder="Correo electrónico" required autoComplete="email" />
        {/* SOLUCIÓN: Contenedor para el input y el icono */}
        <div className="password-input-container">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Contraseña" 
            required 
            autoComplete="current-password" 
            onKeyDown={handleKeyDown} 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn">
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
        <button type="submit" className="submit-button">Ingresar</button>
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

// --- Componente de Registro AHORA es INDEPENDIENTE ---
const RegisterForm = ({ setIsLoading, setIsRegistering }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: 'CO' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  // SOLUCIÓN: Estado para la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  useEffect(() => {
    if (step === 1) nameInputRef.current?.focus();
    if (step === 2) emailInputRef.current?.focus();
    if (step === 3) passwordInputRef.current?.focus();
  }, [step]);
  
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 2 && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      return setError("Por favor, ingresa un formato de correo válido.");
    }
    if (step === 3 && formData.password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }
    setError(null);
    setStep(s => s + 1);
  };
  
  const prevStep = () => setStep(s => s - 1);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    console.log('Intentando registrar usuario con:', { email: formData.email, name: formData.name });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            country_code: formData.country,
          }
        }
      });

      console.log('Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('Error de registro:', error);
        setError(error.message);
      } else if (data.user) {
        console.log('Usuario registrado exitosamente:', data.user);
        
        // Crear el perfil en la tabla profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ 
            id: data.user.id, 
            full_name: formData.name, 
            country_code: formData.country 
          });
        
        if (profileError) {
          console.error('Error creando perfil:', profileError);
          setError(`Usuario creado pero error en perfil: ${profileError.message}`);
        } else {
          console.log('Perfil creado exitosamente');
          setMessage("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
          // Cambiar automáticamente al formulario de login después de unos segundos
          setTimeout(() => {
            setIsRegistering(false);
          }, 3000);
        }
      } else {
        console.log('No se recibió usuario ni error');
        setError('No se pudo completar el registro. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error durante el registro:', err);
      setError(`Error durante el registro: ${err.message}`);
    }
    
    setIsLoading(false);
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
          <input ref={nameInputRef} type="text" name="name" value={formData.name} onChange={handleInputChange} required autoComplete="name" onKeyDown={(e) => handleKeyDown(e, nextStep)} />
          <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
        </div>
        <div className={`form-step ${step === 2 ? 'active' : ''}`}>
          <label>Ingresa tu correo</label>
          <input ref={emailInputRef} type="email" name="email" value={formData.email} onChange={handleInputChange} required autoComplete="email" onKeyDown={(e) => handleKeyDown(e, nextStep)} />
          <button type="button" className="submit-button" onClick={nextStep}>Siguiente</button>
        </div>
        <div className={`form-step ${step === 3 ? 'active' : ''}`}>
          <label>Crea una contraseña segura</label>
          {/* SOLUCIÓN: Contenedor para el input y el icono */}
          <div className="password-input-container">
            <input 
              ref={passwordInputRef} 
              type={showPassword ? "text" : "password"}
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
            <option value="CO">Colombia</option> <option value="MX">México</option> <option value="ES">España</option> <option value="US">Estados Unidos</option>
          </select>
          <button type="submit" className="submit-button">Finalizar Registro</button>
        </div>
      </form>
      <div className="modal-nav-buttons">
        {step > 1 && <button type="button" className="btn-secondary" onClick={prevStep}>Atrás</button>}
        <button type="button" className="btn-secondary" onClick={() => {setIsRegistering(false); setError(null); setMessage(null);}}>
          {step === 1 ? '¿Ya tienes cuenta?' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
};


// --- Componente Principal ---
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

