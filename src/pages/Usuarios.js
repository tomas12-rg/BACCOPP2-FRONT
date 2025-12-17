import React, { useState, useEffect } from 'react';
import { usuariosAPI } from '../services/api';
import { format } from 'date-fns';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '' });

  // Formulario
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: '',
    rol: 'VENDEDOR',
    activo: true
  });

  // Modal de confirmación para eliminar
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await usuariosAPI.getAll();
      setUsuarios(response.data);
    } catch (error) {
      showToast('Error al cargar usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 3000);
  };

  const limpiarFormulario = () => {
    setFormData({
      username: '',
      password: '',
      nombre: '',
      email: '',
      rol: 'VENDEDOR',
      activo: true
    });
    setUsuarioEditando(null);
    setMostrarForm(false);
  };

  const abrirFormularioNuevo = () => {
    limpiarFormulario();
    setMostrarForm(true);
  };

  const abrirFormularioEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      username: usuario.username,
      password: '', // No mostramos la contraseña
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      rol: usuario.rol || 'VENDEDOR',
      activo: usuario.activo !== false
    });
    setMostrarForm(true);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      showToast('El nombre de usuario es obligatorio');
      return;
    }

    if (!usuarioEditando && !formData.password.trim()) {
      showToast('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      setLoading(true);

      const data = {
        username: formData.username,
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        activo: formData.activo.toString()
      };

      // Solo enviar password si se está creando o si se ingresó una nueva
      if (formData.password.trim()) {
        data.password = formData.password;
      }

      if (usuarioEditando) {
        await usuariosAPI.update(usuarioEditando.id, data);
        showToast('Usuario actualizado exitosamente');
      } else {
        await usuariosAPI.register(data);
        showToast('Usuario creado exitosamente');
      }

      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al guardar usuario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminarUsuario = (usuario) => {
    setUsuarioAEliminar(usuario);
    setMostrarModalEliminar(true);
  };

  const eliminarUsuario = async () => {
    try {
      setLoading(true);
      await usuariosAPI.delete(usuarioAEliminar.id);
      showToast('Usuario eliminado exitosamente');
      setMostrarModalEliminar(false);
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al eliminar usuario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getRolBadgeColor = (rol) => {
    switch (rol) {
      case 'ADMIN': return '#d32f2f';
      case 'SUPERVISOR': return '#f57c00';
      case 'VENDEDOR': return '#1976d2';
      default: return '#666';
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -120%)',
          background: '#80001c',
          color: '#fff',
          padding: '18px 40px',
          borderRadius: 12,
          fontWeight: 'bold',
          fontSize: '1.2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 2000
        }}>
          {toast.text}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#80001c', margin: 0 }}>Gestión de Usuarios</h1>
            <div style={{ color: '#888', fontSize: 16 }}>Administra los usuarios del sistema</div>
          </div>
          <button
            onClick={abrirFormularioNuevo}
            style={{
              background: '#80001c',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '12px 24px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Tabla de usuarios */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>Cargando...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>No hay usuarios registrados</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fcebe6', borderBottom: '2px solid #80001c' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Username</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Rol</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Último Acceso</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{usuario.id}</td>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{usuario.username}</td>
                    <td style={{ padding: 12 }}>{usuario.nombre || '-'}</td>
                    <td style={{ padding: 12, fontSize: 14, color: '#666' }}>{usuario.email || '-'}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        background: getRolBadgeColor(usuario.rol),
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: usuario.activo !== false ? '#2e7d32' : '#d32f2f'
                      }}></span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: '#666' }}>
                      {usuario.ultimoAcceso 
                        ? format(new Date(usuario.ultimoAcceso), 'dd/MM/yyyy HH:mm') 
                        : 'Nunca'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button
                        onClick={() => abrirFormularioEditar(usuario)}
                        style={{
                          background: '#1976d2',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          marginRight: 8,
                          fontSize: 12
                        }}
                        title="Editar usuario"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => confirmarEliminarUsuario(usuario)}
                        style={{
                          background: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                        title="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nuevo/Editar Usuario */}
      {mostrarForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            padding: 32,
            width: 500,
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#80001c', marginBottom: 24 }}>
              {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <form onSubmit={guardarUsuario}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={usuarioEditando !== null}
                  placeholder="usuario123"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    background: usuarioEditando ? '#f5f5f5' : '#fff'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Contraseña {!usuarioEditando && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={usuarioEditando ? "Dejar vacío para no cambiar" : "Contraseña"}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd'
                  }}
                  required={!usuarioEditando}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Juan Pérez"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@ejemplo.com"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Usuario Activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: loading ? '#ccc' : '#80001c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '12px 24px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Guardando...' : (usuarioEditando ? 'Actualizar' : 'Crear Usuario')}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: '#fff',
                    color: '#80001c',
                    border: '1px solid #80001c',
                    borderRadius: 6,
                    padding: '12px 24px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {mostrarModalEliminar && usuarioAEliminar && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            width: 400,
            maxWidth: '90%'
          }}>
            <h3 style={{ color: '#d32f2f', marginBottom: 16 }}>⚠️ Confirmar Eliminación</h3>
            <p style={{ marginBottom: 24 }}>
              ¿Está seguro que desea eliminar al usuario <strong>{usuarioAEliminar.username}</strong>?
            </p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={eliminarUsuario}
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? '#ccc' : '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
              <button
                onClick={() => {
                  setMostrarModalEliminar(false);
                  setUsuarioAEliminar(null);
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#80001c',
                  border: '1px solid #80001c',
                  borderRadius: 6,
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;