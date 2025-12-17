import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, usuario }) {
  // Si no hay usuario logueado, redirige al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, muestra el componente hijo
  return children;
}

export default ProtectedRoute;