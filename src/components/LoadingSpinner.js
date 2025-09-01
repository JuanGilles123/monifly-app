import React from 'react';
import logo from '../assets/monifly-logo.png';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-overlay">
      <img src={logo} alt="Cargando..." className="loading-spinner-logo" />
    </div>
  );
};

export default LoadingSpinner;