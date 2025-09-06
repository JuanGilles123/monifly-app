import React from 'react';
import './HistoryTable.css';

// --- Helper para formatear la moneda ---
// Esta función tomará un número y lo convertirá a formato de moneda local (ej: pesos colombianos)
// En el futuro, podríamos usar la preferencia de país del usuario aquí.
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
// --- Fin del Helper ---

const HistoryTable = ({ transactions, onEdit, onDelete }) => {

  const handleDeleteClick = async (id) => {
    // Pedimos confirmación antes de borrar
    const confirmed = window.confirm('¿Estás seguro de que quieres borrar esta transacción?');
    if (confirmed) {
        onDelete(id);
    }
  };

  return (
    <div className="history-table-container">
      <h3>Historial de Transacciones</h3>
      {transactions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descripción</th>
              <th className="amount-col">Monto</th>
              <th className="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className={t.type === 'income' ? 'income-row' : 'expense-row'}>
                <td>
                  <span className={`type-indicator ${t.type}`}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </span>
                </td>
                <td>
                  <span className="description-text">{t.description}</span>
                  <span className="category-text">{t.category}</span>
                </td>
                <td className="amount-col">{formatCurrency(t.amount)}</td>
                <td className="actions-col">
                  <button onClick={() => onEdit(t)} className="action-btn edit-btn">✏️</button>
                  <button onClick={() => handleDeleteClick(t.id)} className="action-btn delete-btn">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-transactions-message">Aún no tienes transacciones registradas.</p>
      )}
    </div>
  );
};

export default HistoryTable;

