import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import TransactionModal from '../components/TransactionModal';
import SummaryCard from '../components/SummaryCard';
import HistoryTable from '../components/HistoryTable';
import './Dashboard.css';

const DashboardPage = ({ session, isDarkMode, toggleDarkMode }) => {
  const [modalType, setModalType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- Estado para controlar la visibilidad del modal
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const fetchUserData = useCallback(async () => {
    setError(null);
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, country_code')
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
          country_code: session.user.user_metadata?.country_code || 'CO'
        });
      }
    } else {
      setProfile(profileData);
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
  
  if (loading) return <div className="loading-fullscreen">Cargando tus datos...</div>;

  return (
    <div className="dashboard-grid-container">
      <main className="dashboard-main-content">
        <header className="dashboard-header">
          <h1>Hola, {profile?.full_name}</h1>
          <p>¿Qué movimiento quieres registrar hoy?</p>
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
          onTransactionSaved={fetchUserData}
          transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default DashboardPage;

