import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ALLOWED_ROLES, ADMIN_ONLY_ROLES } from "../constants/roles";

const items = [
  { icon: "🏠", label: "Dashboard", path: "/dashboard", enabled: true },
  { icon: "💰", label: "Caja", path: "/caja", enabled: true },
  { icon: "🛒", label: "Ventas", path: "/ventas", enabled: true },
  { icon: "👥", label: "Usuarios", path: "/usuarios", enabled: true },
  { icon: "📦", label: "Productos", path: "/productos", enabled: true },
  { icon: "📊", label: "Reportes", path: "/reportes", enabled: true },
  { icon: "🧾", label: "Compras", path: "/compras", enabled: false },
  { icon: "🙍‍♂️", label: "Clientes", path: "/clientes", enabled: false },
  { icon: "💲", label: "Cobros", path: "/cobros", enabled: false },
  { icon: "🚚", label: "Proveedores", path: "/proveedores", enabled: false },
];

export default function Sidebar({ onLogout, usuario }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Filtrar items según el rol del usuario
  const getFilteredItems = () => {
    if (!usuario) return items;
    
    // Si NO es ADMIN, aplicar filtros
    if (!ADMIN_ONLY_ROLES.includes(usuario.rol)) {
      // Si es SUPERVISOR: mostrar Dashboard y Reportes, ocultar Usuarios
      if (ALLOWED_ROLES.includes(usuario.rol)) {
        return items.filter(item => item.label !== 'Usuarios');
      }
      // Si es VENDEDOR: ocultar Dashboard, Reportes y Usuarios
      return items.filter(item => 
        item.label !== 'Dashboard' && 
        item.label !== 'Reportes' && 
        item.label !== 'Usuarios'
      );
    }
    
    // Para ADMIN: mostrar todos los items
    return items;
  };

  const filteredItems = getFilteredItems();

  const handleItemClick = (item) => {
    if (item.enabled) {
      navigate(item.path);
    }
  };

  return (
    <div style={{
      width: 260,
      background: "#fff",
      minHeight: "100vh",
      borderRight: "1px solid #eee",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0"
    }}>
      <div style={{
        fontWeight: "bold",
        fontSize: 24,
        color: "#80001c",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 32px",
        marginBottom: 32
      }}>
        <span style={{ fontSize: 28 }}>🍷</span>
        BaccoSoft
      </div>

      {/* Información del usuario */}
      {usuario && (
        <div style={{
          padding: "12px 32px",
          marginBottom: 16,
          borderBottom: "1px solid #eee"
        }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Usuario:</div>
          <div style={{ fontWeight: "bold", color: "#80001c" }}>{usuario.username}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Rol: {usuario.rol || 'USER'}
          </div>
        </div>
      )}

      <nav style={{ flex: 1 }}>
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path && item.enabled;
          const isDisabled = !item.enabled;
          
          return (
            <div
              key={item.label}
              onClick={() => handleItemClick(item)}
              title={isDisabled ? "Próximamente disponible" : item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 32px",
                color: isDisabled ? "#ccc" : (isActive ? "#fff" : "#80001c99"),
                background: isActive ? "#80001c" : "transparent",
                borderRadius: 8,
                fontWeight: isActive ? "bold" : "normal",
                margin: "4px 0",
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: isDisabled ? 0.5 : 1,
                position: "relative"
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isDisabled) {
                  e.currentTarget.style.background = "#fcebe6";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isDisabled) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ filter: isDisabled ? "grayscale(100%)" : "none" }}>
                {item.icon}
              </span>
              {item.label}
              {isDisabled && (
                <span style={{
                  fontSize: 10,
                  background: "#f7aa04",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: 4,
                  marginLeft: "auto",
                  fontWeight: "bold"
                }}>
                  PRONTO
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{
        borderTop: "1px solid #eee",
        margin: "24px 0 0 0",
        padding: "18px 32px 0 32px",
        color: "#80001c99",
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        Configuraciones
      </div>

      <button
        onClick={onLogout}
        style={{
          margin: "24px 32px 0 32px",
          background: "#fff",
          color: "#80001c",
          border: "1px solid #80001c",
          borderRadius: 50,
          padding: "8px 18px",
          fontWeight: "bold",
          fontSize: "1.1rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#80001c";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.color = "#80001c";
        }}
        title="Cerrar sesión"
      >
        <span style={{ fontSize: 22 }}>🔒</span> Cerrar sesión
      </button>
    </div>
  );
}