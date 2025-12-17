import React, { useState } from "react";
import { usuariosAPI } from '../services/api';
import logoCircular from '../logo_circular_final.png';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMsg, setRegMsg] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [animClass, setAnimClass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");
    if (!username || !password) {
      setLoginMsg("Completa usuario y contraseña");
      return;
    }
    try {
      setLoading(true);
      const response = await usuariosAPI.login(username, password);
      const data = response.data;
      
      // La nueva API devuelve directamente los datos del usuario
      onLogin({
        id: data.id,
        username: data.username,
        rol: data.rol,
        nombre: data.nombre,
        email: data.email
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Usuario o contraseña incorrectos";
      setLoginMsg(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMsg("");
    if (!regUsername || !regPassword) {
      setRegMsg("Completa usuario y contraseña");
      return;
    }
    try {
      setLoading(true);
      
      const userData = {
        username: regUsername,
        password: regPassword,
        nombre: regNombre || regUsername,
        email: regEmail || "",
        rol: "VENDEDOR" // Por defecto se crea como vendedor
      };
      
      await usuariosAPI.register(userData);
      setRegMsg("Cuenta creada correctamente");
      
      setTimeout(() => {
        setShowRegister(false);
        setUsername("");
        setPassword("");
        setLoginMsg("");
        setRegUsername("");
        setRegPassword("");
        setRegNombre("");
        setRegEmail("");
        setRegMsg("");
      }, 1200);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al crear cuenta";
      setRegMsg(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    setAnimClass("slide");
    setTimeout(() => {
      setShowRegister(true);
      setAnimClass("");
      setLoginMsg("");
    }, 300);
  };

  const goToLogin = () => {
    setAnimClass("slide");
    setTimeout(() => {
      setShowRegister(false);
      setRegMsg("");
      setRegUsername("");
      setRegPassword("");
      setRegNombre("");
      setRegEmail("");
      setUsername("");
      setPassword("");
      setLoginMsg("");
      setAnimClass("");
    }, 300);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fcebe6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <style>
        {`
        .slide {
          animation: slideFade 0.3s;
        }
        @keyframes slideFade {
          0% { opacity: 0; transform: translateY(30px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        `}
      </style>
      <div className={animClass} style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        padding: 32,
        minWidth: 340,
        maxWidth: 400,
        width: "100%",
        borderTop: showRegister ? "8px solid #f7aa04ff" : "8px solid #80001c"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
          <img
            src={logoCircular}
            alt="Logo"
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
              marginBottom: 8,
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)"
            }}
          />
          <h2 style={{ color: "#80001c", margin: 0, fontWeight: "bold", fontSize: 32 }}>Bienvenido a BaccoSoft</h2>
          <div style={{ color: "#80001c99", fontSize: 18, marginTop: 4, marginBottom: 8 }}>
            Sistema de Gestión de Vinoteca
          </div>
        </div>
        
        {!showRegister ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Usuario</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #fcebe6",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                autoFocus
                placeholder="Ingrese su usuario"
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #fcebe6",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                placeholder="Ingrese su contraseña"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              background: loading ? "#ccc" : "#80001c",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
              marginBottom: 10
            }}>
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
            <button type="button" onClick={goToRegister} disabled={loading} style={{
              background: "#fff",
              color: "#80001c",
              border: "1px solid #80001c",
              borderRadius: 6,
              padding: "10px 24px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%"
            }}>
              Crear cuenta
            </button>
            {loginMsg && <div style={{ color: "#d32f2f", marginTop: 16, textAlign: "center", fontWeight: "bold" }}>{loginMsg}</div>}
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Usuario *</label>
              <input
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #d29819ff",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                autoFocus
                placeholder="Ingrese su usuario"
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Contraseña *</label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #d29819ff",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                placeholder="Ingrese su contraseña"
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Nombre Completo</label>
              <input
                value={regNombre}
                onChange={e => setRegNombre(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #d29819ff",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                placeholder="Ej: Juan Pérez (opcional)"
                disabled={loading}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: "bold" }}>Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #d29819ff",
                  marginTop: 4,
                  marginBottom: 8,
                  background: "#fff"
                }}
                placeholder="correo@ejemplo.com (opcional)"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              background: loading ? "#ccc" : "#f7aa04ff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "12px 24px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
              marginBottom: 10
            }}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
            <button type="button" onClick={goToLogin} disabled={loading} style={{
              background: "#fff",
              color: "#f7aa04ff",
              border: "1px solid #d29819ff",
              borderRadius: 6,
              padding: "10px 24px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%"
            }}>
              Volver a inicio
            </button>
            {regMsg && (
              <div style={{ 
                color: regMsg.includes("correctamente") ? "#2e7d32" : "#d32f2f", 
                marginTop: 16, 
                textAlign: "center",
                fontWeight: "bold"
              }}>
                {regMsg}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;