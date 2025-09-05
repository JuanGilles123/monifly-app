import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import TransactionModal from '../components/TransactionModal';
import TransactionAnimation from '../components/TransactionAnimation';
import StreakCounter from '../components/StreakCounter';
import SummaryCard from '../components/SummaryCard';
import HistoryTable from '../components/HistoryTable';
import WelcomeModal from '../components/WelcomeModal';
import './Dashboard.css';

const DashboardPage = ({ session, isDarkMode, toggleDarkMode }) => {
  const [modalType, setModalType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- Estado para controlar la visibilidad del modal
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  
  // Estados para la animación
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState('');
  const [animationAmount, setAnimationAmount] = useState(0);

  // Estado para el modal de bienvenida
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const fetchUserData = useCallback(async () => {
    setError(null);
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, country_code, has_seen_welcome, welcome_seen_at')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Si no encuentra el perfil, lo creamos
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: session.user.id, 
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          country_code: session.user.user_metadata?.country_code || 'CO'
        });
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        setProfile({ full_name: 'Usuario' });
      } else {
        setProfile({ 
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
          country_code: session.user.user_metadata?.country_code || 'CO',
          has_seen_welcome: false
        });
        // Mostrar bienvenida para nuevos usuarios
        setShowWelcomeModal(true);
      }
    } else {
      setProfile(profileData);
      // Verificar si debe mostrar el modal de bienvenida
      if (!profileData.has_seen_welcome) {
        setShowWelcomeModal(true);
      }
    }

    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      // Si la tabla transactions no existe, inicializar vacío
      setTransactions([]);
    } else {
      setTransactions(transactionsData);
    }

    setLoading(false);
  }, [session.user]);

  useEffect(() => {
    fetchUserData();

    // NUEVO: Escuchar actualizaciones de perfil
    const handleProfileUpdate = (event) => {
      const { fullName } = event.detail;
      setProfile(prev => ({
        ...prev,
        full_name: fullName
      }));
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchUserData]);

  const handleDelete = async (transactionId) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      setError(`Error al borrar: ${error.message}`);
    } else {
      // Refresca los datos después de borrar exitosamente
      fetchUserData();
    }
  };

  const openModal = (type, transaction = null) => {
    setModalType(type);
    setTransactionToEdit(transaction);
    setIsModalOpen(true); // <-- Abre el modal
  };

  // ***** CORRECCIÓN IMPORTANTE AQUÍ *****
  const closeModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(false); // <-- Cierra el modal
    setModalType('');
  };

  // Función para manejar cuando se guarda una transacción
  const handleTransactionSaved = (transaction) => {
    // Mostrar animación de transacción primero
    setAnimationType(transaction.type);
    setAnimationAmount(transaction.amount);
    setShowAnimation(true);
    
    // Actualizar datos
    fetchUserData();
  };

  // Función para cuando termina la animación de transacción
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    
    // Después de que termine la animación de transacción, mostrar la de racha
    setTimeout(() => {
      if (window.incrementStreak) {
        window.incrementStreak();
      }
    }, 300); // Pequeño delay para que sea más suave
  };
  
  if (loading) return <div className="loading-fullscreen">Cargando tus datos...</div>;

  return (
    <div className="dashboard-grid-container">
      <main className="dashboard-main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Hola, {profile?.full_name}</h1>
              <p>¿Qué movimiento quieres registrar hoy?</p>
            </div>
            <div className="header-actions">
              <StreakCounter userId={session.user.id} isDarkMode={isDarkMode} />
            </div>
          </div>
        </header>

        {error && <p className="error-message dashboard-error">{error}</p>}
        
        <div className="dark-mode-toggle-dashboard">
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="dashboard-actions-grid">
          <div className="action-card income" onClick={() => openModal('income')}>
            <div className="icon-placeholder">↑</div>
            <h2>Registrar Ingreso</h2>
          </div>
          <div className="action-card expense" onClick={() => openModal('expense')}>
            <div className="icon-placeholder">↓</div>
            <h2>Registrar Gasto</h2>
          </div>
        </div>

        <HistoryTable 
            transactions={transactions} 
            onEdit={(t) => openModal(t.type, t)} 
            onDelete={handleDelete}
        />
      </main>

      <aside className="dashboard-summary">
        <SummaryCard transactions={transactions} />
      </aside>

      {/* El modal ahora se controla con isModalOpen */}
      <TransactionModal
          isOpen={isModalOpen} 
          onClose={closeModal} 
          type={modalType} 
          session={session}
          onTransactionSaved={handleTransactionSaved}
          transactionToEdit={transactionToEdit}
      />

      {/* Animación de transacción */}
      <TransactionAnimation
        show={showAnimation}
        type={animationType}
        amount={animationAmount}
        onComplete={handleAnimationComplete}
      />

      {/* Modal de bienvenida */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        session={session}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default DashboardPage;

