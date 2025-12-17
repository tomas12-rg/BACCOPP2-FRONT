import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Ventas from './pages/Ventas';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Caja from './pages/Caja';
import Sidebar from './components/Sidebar';

// Roles permitidos para acceder a rutas protegidas
const ALLOWED_ROLES = ['ADMINISTRADOR', 'SUPERVISOR'];

// Componente para proteger rutas según el rol del usuario
function ProtectedRoute({ children, usuario }) {
  if (!usuario || !ALLOWED_ROLES.includes(usuario.rol)) {
    return <Navigate to="/ventas" replace />;
  }
  
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUsuario(userData);
    setIsAuthenticated(true);
    localStorage.setItem('usuario', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem('usuario');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Determinar la ruta inicial según el rol del usuario
  const getDefaultRoute = () => {
    if (usuario && ALLOWED_ROLES.includes(usuario.rol)) {
      return '/dashboard';
    }
    return '/ventas';
  };

  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar onLogout={handleLogout} usuario={usuario} />
        <div style={{ flex: 1, background: '#f5f5f5', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute usuario={usuario}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/caja" element={<Caja />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/productos" element={<Productos />} />
            <Route 
              path="/reportes" 
              element={
                <ProtectedRoute usuario={usuario}>
                  <Reportes />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;