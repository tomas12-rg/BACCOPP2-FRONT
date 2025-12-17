import React, { useState, useEffect } from 'react';
import { cajaAPI } from '../services/api';
import { format } from 'date-fns';

function Caja() {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaActual, setCajaActual] = useState(null);
  const [montoInicial, setMontoInicial] = useState('');
  const [observacionesApertura, setObservacionesApertura] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);

  useEffect(() => {
    verificarEstadoCaja();
    cargarHistorial();
  }, []);

  const verificarEstadoCaja = async () => {
    try {
      console.log('🔍 Verificando estado de caja...');
      const response = await cajaAPI.getEstado();
      console.log('📦 Estado caja:', response.data);
      
      setCajaAbierta(response.data.abierta);
      if (response.data.abierta && response.data.caja) {
        setCajaActual(response.data.caja);
      } else {
        setCajaActual(null);
      }
    } catch (error) {
      console.error('❌ Error al verificar estado de caja:', error);
    }
  };

  const cargarHistorial = async () => {
    try {
      console.log('📋 Cargando historial...');
      const response = await cajaAPI.getHistorial();
      console.log('📊 Historial:', response.data);
      
      // Filtrar solo cajas cerradas y ordenar por fecha
      const cajasCerradas = response.data
        .filter(caja => caja.fechaCierre !== null)
        .sort((a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));
      
      setHistorial(cajasCerradas);
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
    }
  };

  const abrirCaja = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      console.log('🔓 Abriendo caja con monto:', montoInicial);
      
      const response = await cajaAPI.abrir({
        montoInicial: parseFloat(montoInicial) || 0,
        usuario: 'Usuario',
        observaciones: observacionesApertura || ''
      });

      console.log('✅ Respuesta apertura:', response.data);

      alert(response.data.message || '✅ Caja abierta exitosamente');
      
      setMostrarModalAbrir(false);
      setMontoInicial('');
      setObservacionesApertura('');
      await verificarEstadoCaja();
      
    } catch (error) {
      console.error('❌ Error al abrir caja:', error);
      alert('Error al abrir la caja: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cerrarCaja = async () => {
    if (!window.confirm('¿Estás seguro de cerrar la caja?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔒 Cerrando caja...');
      
      const response = await cajaAPI.cerrar({
        observaciones: observacionesCierre || ''
      });

      console.log('✅ Respuesta cierre:', response.data);

      const { montoInicial, totalVentas, montoFinal, cantidadVentas, diferencia } = response.data;

      alert(
        `✅ Caja cerrada exitosamente\n\n` +
        `💰 Monto Inicial: $${montoInicial?.toFixed(2)}\n` +
        `📈 Total Ventas: $${totalVentas?.toFixed(2)}\n` +
        `💵 Monto Final: $${montoFinal?.toFixed(2)}\n` +
        `🧾 Cantidad Ventas: ${cantidadVentas}\n` +
        `📊 Diferencia: $${diferencia?.toFixed(2)}`
      );
      
      setMostrarModalCerrar(false);
      setObservacionesCierre('');
      await verificarEstadoCaja();
      await cargarHistorial();
      
    } catch (error) {
      console.error('❌ Error al cerrar caja:', error);
      alert('Error al cerrar la caja: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#fcebe6', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ color: '#80001c', marginBottom: 8, fontSize: 32, fontWeight: 'bold' }}>
          💰 Gestión de Caja
        </h1>
        <p style={{ color: '#888', fontSize: 16, marginBottom: 32 }}>
          Control de apertura y cierre de caja
        </p>

        {/* Estado Actual de Caja */}
        <div style={{
          background: cajaAbierta ? '#e8f5e9' : '#fff3e0',
          border: `3px solid ${cajaAbierta ? '#2e7d32' : '#f57c00'}`,
          borderRadius: 12,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <h2 style={{ 
                color: cajaAbierta ? '#2e7d32' : '#f57c00',
                margin: 0,
                fontSize: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                {cajaAbierta ? '🟢 Caja Abierta' : '🟠 Caja Cerrada'}
              </h2>
              
              {cajaAbierta && cajaActual && (
                <div style={{ marginTop: 16, color: '#666' }}>
                  <p style={{ margin: '8px 0', fontSize: 16 }}>
                    <strong>📅 Apertura:</strong> {format(new Date(cajaActual.fechaApertura), 'dd/MM/yyyy HH:mm')}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: 16 }}>
                    <strong>💵 Monto Inicial:</strong> ${cajaActual.montoInicial?.toFixed(2) || '0.00'}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: 16 }}>
                    <strong>💰 Total Ventas:</strong> ${cajaActual.totalVentas?.toFixed(2) || '0.00'}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: 16 }}>
                    <strong>🧾 Cantidad Ventas:</strong> {cajaActual.cantidadVentas || 0}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: 18, fontWeight: 'bold', color: '#2e7d32' }}>
                    <strong>💼 Total en Caja:</strong> ${((cajaActual.montoInicial || 0) + (cajaActual.totalVentas || 0)).toFixed(2)}
                  </p>
                </div>
              )}

              {!cajaAbierta && (
                <p style={{ marginTop: 16, color: '#f57c00', fontSize: 16 }}>
                  ⚠️ No se pueden realizar ventas con la caja cerrada
                </p>
              )}
            </div>

            <div>
              {cajaAbierta ? (
                <button
                  onClick={() => setMostrarModalCerrar(true)}
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '16px 40px',
                    fontSize: 18,
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.background = '#b71c1c')}
                  onMouseOut={(e) => !loading && (e.target.style.background = '#d32f2f')}
                >
                  {loading ? '⏳ Procesando...' : '🔒 Cerrar Caja'}
                </button>
              ) : (
                <button
                  onClick={() => setMostrarModalAbrir(true)}
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '16px 40px',
                    fontSize: 18,
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => !loading && (e.target.style.background = '#1b5e20')}
                  onMouseOut={(e) => !loading && (e.target.style.background = '#2e7d32')}
                >
                  {loading ? '⏳ Procesando...' : '🔓 Abrir Caja'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Abrir Caja */}
        {mostrarModalAbrir && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ color: '#80001c', marginBottom: 24, fontSize: 24 }}>
                🔓 Abrir Caja
              </h3>
              
              <form onSubmit={abrirCaja}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
                    💵 Monto Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: 14,
                      borderRadius: 8,
                      border: '2px solid #ddd',
                      fontSize: 18
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
                    📝 Observaciones (opcional)
                  </label>
                  <textarea
                    value={observacionesApertura}
                    onChange={(e) => setObservacionesApertura(e.target.value)}
                    placeholder="Notas sobre la apertura..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      border: '2px solid #ddd',
                      fontSize: 14,
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalAbrir(false);
                      setMontoInicial('');
                      setObservacionesApertura('');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: '#fff',
                      color: '#80001c',
                      border: '2px solid #80001c',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: loading ? '#ccc' : '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '⏳ Abriendo...' : '✅ Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cerrar Caja */}
        {mostrarModalCerrar && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ color: '#80001c', marginBottom: 24, fontSize: 24 }}>
                🔒 Cerrar Caja
              </h3>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
                  📝 Observaciones de Cierre (opcional)
                </label>
                <textarea
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Notas sobre el cierre..."
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '2px solid #ddd',
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCerrar(false);
                    setObservacionesCierre('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#fff',
                    color: '#80001c',
                    border: '2px solid #80001c',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={cerrarCaja}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: loading ? '#ccc' : '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳ Cerrando...' : '✅ Confirmar Cierre'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón Ver Historial */}
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.target.style.background = '#1565c0'}
          onMouseOut={(e) => e.target.style.background = '#1976d2'}
        >
          {mostrarHistorial ? '📊 Ocultar Historial' : '📋 Ver Historial de Cajas'}
        </button>

        {/* Historial de Cajas */}
        {mostrarHistorial && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#80001c', marginBottom: 16, fontSize: 20 }}>
              Historial de Cajas Cerradas
            </h3>
            {historial.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                📭 No hay registros de cajas cerradas
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fcebe6', borderBottom: '2px solid #80001c' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Apertura</th>
                      <th style={{ padding: 12, textAlign: 'left' }}>Cierre</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Inicial</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Ventas</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Final</th>
                      <th style={{ padding: 12, textAlign: 'center' }}>Cant. Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(caja => (
                      <tr key={caja.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 12 }}>
                          {format(new Date(caja.fechaApertura), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td style={{ padding: 12 }}>
                          {caja.fechaCierre ? format(new Date(caja.fechaCierre), 'dd/MM/yyyy HH:mm') : '-'}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                          ${caja.montoInicial?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', color: '#2e7d32', fontWeight: 'bold' }}>
                          ${caja.totalVentas?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }}>
                          ${caja.montoFinal?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          {caja.cantidadVentas || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Caja;