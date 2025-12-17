import React, { useState, useEffect } from 'react';
import { ventasAPI, productosAPI } from '../services/api';
import { format } from 'date-fns';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '', tipo: 'error' });
  
  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Formulario de venta
  const [ventaEditando, setVentaEditando] = useState(null);
  const [detalles, setDetalles] = useState([{ productoId: '', cantidad: 1 }]);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  // Modal de tarjeta
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: ''
  });

  // Modal de efectivo
  const [mostrarModalEfectivo, setMostrarModalEfectivo] = useState(false);
  const [montoPagado, setMontoPagado] = useState('');

  // Modal de confirmación para eliminar
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState(null);

  useEffect(() => {
    // Establecer fechas por defecto (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    cargarVentas(hoy, hoy);
    cargarProductos();
  }, []);

  const cargarVentas = async (desde = fechaDesde, hasta = fechaHasta) => {
  try {
    setLoading(true);
    let response;
    
    if (desde && hasta) {
      // ✅ CORREGIDO: Usar getByDateRange en lugar de getPorRangoFechas
      const desdeISO = new Date(desde).toISOString();
      const hastaISO = new Date(hasta + 'T23:59:59').toISOString();
      response = await ventasAPI.getByDateRange(desdeISO, hastaISO);
    } else {
      // Sin filtro: traer todas las ventas
      response = await ventasAPI.getAll();
    }
    
    setVentas(response.data);
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    showToast('❌ Error al cargar ventas', 'error');
  } finally {
    setLoading(false);
  }
};

  const cargarProductos = async () => {
    try {
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      showToast('❌ Error al cargar productos', 'error');
      console.error(error);
    }
  };

  const showToast = (text, tipo = 'error') => {
    setToast({ show: true, text, tipo });
    setTimeout(() => setToast({ show: false, text: '', tipo: 'error' }), 3500);
  };

  const filtrarHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    cargarVentas(hoy, hoy);
  };

  const filtrarSemana = () => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7*24*60*60*1000);
    const desde = hace7Dias.toISOString().split('T')[0];
    const hasta = hoy.toISOString().split('T')[0];
    setFechaDesde(desde);
    setFechaHasta(hasta);
    cargarVentas(desde, hasta);
  };

  const filtrarMes = () => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - 30*24*60*60*1000);
    const desde = hace30Dias.toISOString().split('T')[0];
    const hasta = hoy.toISOString().split('T')[0];
    setFechaDesde(desde);
    setFechaHasta(hasta);
    cargarVentas(desde, hasta);
  };

  const filtrarTodo = () => {
    setFechaDesde('');
    setFechaHasta('');
    cargarVentas('', '');
  };

  const aplicarFiltro = () => {
    cargarVentas(fechaDesde, fechaHasta);
  };

  const agregarDetalle = () => {
    setDetalles([...detalles, { productoId: '', cantidad: 1 }]);
  };

  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = field === 'cantidad' ? parseInt(value) : value;
    setDetalles(nuevosDetalles);
  };

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => {
      const producto = productos.find(p => p.id === parseInt(detalle.productoId));
      if (producto) {
        return total + (producto.precio * detalle.cantidad);
      }
      return total;
    }, 0);
  };

  const formatearNumeroTarjeta = (valor) => {
    const numero = valor.replace(/\D/g, '');
    return numero.substring(0, 16);
  };

  const formatearVencimiento = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length >= 2) {
      return numeros.substring(0, 2) + '/' + numeros.substring(2, 4);
    }
    return numeros;
  };

  const validarDatosTarjeta = () => {
    if (datosTarjeta.numero.length !== 16) {
      showToast('⚠️ Número de tarjeta inválido', 'warning');
      return false;
    }
    if (!datosTarjeta.titular.trim()) {
      showToast('⚠️ Ingrese el titular de la tarjeta', 'warning');
      return false;
    }
    if (datosTarjeta.vencimiento.length !== 5) {
      showToast('⚠️ Vencimiento inválido', 'warning');
      return false;
    }
    if (datosTarjeta.cvv.length !== 3) {
      showToast('⚠️ CVV inválido', 'warning');
      return false;
    }
    return true;
  };

  const limpiarFormulario = () => {
    setDetalles([{ productoId: '', cantidad: 1 }]);
    setMetodoPago('EFECTIVO');
    setDatosTarjeta({ numero: '', titular: '', vencimiento: '', cvv: '' });
    setMontoPagado('');
    setMostrarForm(false);
    setMostrarModalTarjeta(false);
    setMostrarModalEfectivo(false);
    setVentaEditando(null);
  };

  const procesarVenta = async (montoPagadoEfectivo = null) => {
    try {
      setLoading(true);
      const ventaData = {
        detalles: detalles.map(d => ({
          productoId: parseInt(d.productoId),
          cantidad: d.cantidad
        })),
        metodoPago
      };

      if (metodoPago === 'EFECTIVO' && montoPagadoEfectivo) {
        ventaData.montoPagado = parseFloat(montoPagadoEfectivo);
      }

      let response;
      if (ventaEditando) {
        response = await ventasAPI.update(ventaEditando.id, ventaData);
        showToast('✅ Venta modificada exitosamente', 'success');
      } else {
        response = await ventasAPI.create(ventaData);
        if (response.data.vuelto !== undefined) {
          showToast(`✅ Venta exitosa. Vuelto: $${response.data.vuelto.toFixed(2)}`, 'success');
        } else {
          showToast('✅ Venta registrada exitosamente', 'success');
        }
      }
      
      limpiarFormulario();
      cargarVentas(fechaDesde, fechaHasta);
      cargarProductos();
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al procesar venta';
      
      if (mensaje.includes('caja')) {
        showToast('⚠️ ' + mensaje, 'warning');
      } else {
        showToast('❌ ' + mensaje, 'error');
      }
      
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const crearVenta = async (e) => {
    e.preventDefault();
    
    if (detalles.length === 0 || !detalles[0].productoId) {
      showToast('⚠️ Agrega al menos un producto', 'warning');
      return;
    }

    if (metodoPago === 'EFECTIVO') {
      setMostrarModalEfectivo(true);
    } else if (metodoPago === 'TARJETA_CREDITO' || metodoPago === 'TARJETA_DEBITO') {
      setMostrarModalTarjeta(true);
    } else {
      procesarVenta();
    }
  };

  const confirmarPagoTarjeta = () => {
    if (validarDatosTarjeta()) {
      setMostrarModalTarjeta(false);
      procesarVenta();
    }
  };

  const confirmarPagoEfectivo = () => {
    const monto = parseFloat(montoPagado);
    const total = calcularTotal();
    
    if (!monto || monto < total) {
      showToast('⚠️ El monto pagado es insuficiente', 'warning');
      return;
    }
    
    setMostrarModalEfectivo(false);
    procesarVenta(monto);
  };

  const editarVenta = async (venta) => {
    try {
      const response = await ventasAPI.getById(venta.id);
      const ventaCompleta = response.data;
      
      setVentaEditando(ventaCompleta);
      setMetodoPago(ventaCompleta.metodoPago);
      setDetalles(ventaCompleta.detalles.map(d => ({
        productoId: d.producto.id,
        cantidad: d.cantidad
      })));
      setMostrarForm(true);
    } catch (error) {
      showToast('❌ Error al cargar venta', 'error');
      console.error(error);
    }
  };

  const confirmarEliminarVenta = (venta) => {
    setVentaAEliminar(venta);
    setMostrarModalEliminar(true);
  };

  const eliminarVenta = async () => {
    try {
      setLoading(true);
      await ventasAPI.delete(ventaAEliminar.id);
      showToast('✅ Venta eliminada exitosamente', 'success');
      setMostrarModalEliminar(false);
      setVentaAEliminar(null);
      cargarVentas(fechaDesde, fechaHasta);
      cargarProductos();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al eliminar venta';
      
      if (errorMsg.includes('caja')) {
        showToast('⚠️ ' + errorMsg, 'warning');
      } else {
        showToast('❌ ' + errorMsg, 'error');
      }
      
      console.error('Error completo:', error.response?.data);
      setMostrarModalEliminar(false);
      setVentaAEliminar(null);
    } finally {
      setLoading(false);
    }
  };

  const generarReportePDF = async () => {
  try {
    console.log('📄 Generando PDF...');
    console.log('Desde:', fechaDesde);
    console.log('Hasta:', fechaHasta);
    
    showToast('📄 Generando reporte PDF...', 'success');
    
    // ✅ CORREGIDO: Convertir fechas a ISO DateTime
    const desdeISO = fechaDesde ? new Date(fechaDesde).toISOString() : null;
    const hastaISO = fechaHasta ? new Date(fechaHasta + 'T23:59:59').toISOString() : null;
    
    console.log('Desde ISO:', desdeISO);
    console.log('Hasta ISO:', hastaISO);
    
    const response = await ventasAPI.exportPDF(desdeISO, hastaISO);
    
    console.log('✅ PDF recibido, tamaño:', response.data.size, 'bytes');
    
    // Crear blob y descargar
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nombre del archivo con rango de fechas
    const nombreArchivo = fechaDesde && fechaHasta 
      ? `ventas_${fechaDesde}_${fechaHasta}.pdf`
      : `ventas_${new Date().toISOString().split('T')[0]}.pdf`;
    
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ PDF descargado:', nombreArchivo);
    showToast('✅ Reporte descargado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('Respuesta:', error.response);
    showToast('❌ Error al generar reporte: ' + (error.response?.data?.error || error.message), 'error');
  }
};

  return (
    <div style={{ padding: 24 }}>
      {/* Toast Mejorado */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -120%)',
          background: toast.tipo === 'success' ? '#2e7d32' : 
                     toast.tipo === 'warning' ? '#f57c00' : '#d32f2f',
          color: '#fff',
          padding: '18px 40px',
          borderRadius: 12,
          fontWeight: 'bold',
          fontSize: '1.1rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 2000,
          minWidth: 300,
          textAlign: 'center',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <style>
            {`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translate(-50%, -150%);
                }
                to {
                  opacity: 1;
                  transform: translate(-50%, -120%);
                }
              }
            `}
          </style>
          {toast.text}
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: '#80001c', margin: 0 }}>Gestión de Ventas</h1>
            <div style={{ color: '#888', fontSize: 16 }}>Registra y consulta ventas</div>
          </div>
          <button
            onClick={() => setMostrarForm(true)}
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
            ➕ Nueva Venta
          </button>
        </div>

        {/* Filtro de Fechas */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16,
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#80001c' }}>
                📅 Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#80001c' }}>
                📅 Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              />
            </div>
            <div>
              <button
                onClick={aplicarFiltro}
                style={{
                  width: '100%',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: 12,
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔍 Filtrar
              </button>
            </div>
          </div>
          
          {/* Botones de filtrado rápido */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={filtrarHoy}
              style={{
                background: '#fff',
                color: '#80001c',
                border: '1px solid #80001c',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Hoy
            </button>
            <button
              onClick={filtrarSemana}
              style={{
                background: '#fff',
                color: '#80001c',
                border: '1px solid #80001c',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Última Semana
            </button>
            <button
              onClick={filtrarMes}
              style={{
                background: '#fff',
                color: '#80001c',
                border: '1px solid #80001c',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Último Mes
            </button>
            <button
              onClick={filtrarTodo}
              style={{
                background: '#fff',
                color: '#80001c',
                border: '1px solid #80001c',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Todo
            </button>
            <button
              onClick={generarReportePDF}
              disabled={ventas.length === 0}
              style={{
                background: ventas.length === 0 ? '#ccc' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: ventas.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 'bold',
                marginLeft: 'auto'
              }}
            >
              📄 Descargar PDF
            </button>
          </div>
        </div>

        {/* Resumen */}
        {ventas.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fcebe6 0%, #fff5f2 100%)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>💰 Total Vendido</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#80001c' }}>
                  ${ventas.reduce((sum, v) => sum + (v.total || 0), 0).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>🧾 Cantidad de Ventas</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>
                  {ventas.length}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>📊 Ticket Promedio</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1976d2' }}>
                  ${(ventas.reduce((sum, v) => sum + (v.total || 0), 0) / ventas.length).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de ventas */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#80001c', marginBottom: 16 }}>
            {fechaDesde && fechaHasta 
              ? `Ventas del ${fechaDesde} al ${fechaHasta}` 
              : 'Todas las Ventas'}
          </h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>Cargando...</div>
          ) : ventas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ color: '#888', fontSize: 16 }}>No hay ventas registradas para el período seleccionado</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fcebe6', borderBottom: '2px solid #80001c' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Fecha</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Total</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Método Pago</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>N° Transacción</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(venta => (
                    <tr key={venta.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12 }}>{venta.id}</td>
                      <td style={{ padding: 12 }}>
                        {venta.fecha ? format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td style={{ padding: 12, fontWeight: 'bold', color: '#2e7d32' }}>
                        ${venta.total?.toFixed(2)}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {venta.metodoPago}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 12, color: '#666' }}>
                        {venta.numeroTransaccion || '-'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <button
                          onClick={() => editarVenta(venta)}
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
                          title="Editar venta"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => confirmarEliminarVenta(venta)}
                          style={{
                            background: '#d32f2f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                          title="Eliminar venta"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva/Editar Venta */}
      {mostrarForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
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
            minWidth: 600,
            maxWidth: 800,
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={limpiarFormulario}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 28,
                color: '#80001c',
                cursor: 'pointer'
              }}
            >×</button>

            <form onSubmit={crearVenta}>
              <h2 style={{ color: '#80001c', marginBottom: 24 }}>
                {ventaEditando ? 'Modificar Venta' : 'Nueva Venta'}
              </h2>

              {/* Detalles de productos */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#666', fontSize: 18, marginBottom: 12 }}>Productos</h3>
                {detalles.map((detalle, index) => (
                  <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <select
                      value={detalle.productoId}
                      onChange={(e) => actualizarDetalle(index, 'productoId', e.target.value)}
                      style={{
                        flex: 2,
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid #ddd'
                      }}
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {productos.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.nombre} - ${prod.precio} (Stock: {prod.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={detalle.cantidad}
                      onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid #ddd'
                      }}
                      placeholder="Cantidad"
                      required
                    />
                    {detalles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarDetalle(index)}
                        style={{
                          background: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '10px 16px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarDetalle}
                  style={{
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  + Agregar Producto
                </button>
              </div>

              {/* Método de pago */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

              {/* Total */}
              <div style={{
                background: '#fcebe6',
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#80001c' }}>TOTAL:</span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>

              {/* Botones */}
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
                  {loading ? 'Procesando...' : (ventaEditando ? 'Guardar Cambios' : 'Continuar')}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  style={{
                    flex: 1,
                    background: '#fff',
                    color: '#80001c',
                    border: '1px solid #80001c',
                    borderRadius: 6,
                    padding: '12px 24px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago Efectivo */}
      {mostrarModalEfectivo && (
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
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: '#80001c', marginBottom: 24 }}>Pago en Efectivo</h3>
            
            <div style={{
              background: '#fcebe6',
              padding: 16,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold' }}>Total a pagar:</span>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#80001c' }}>
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                Monto Pagado
              </label>
              <input
                type="number"
                step="0.01"
                min={calcularTotal()}
                value={montoPagado}
                onChange={(e) => setMontoPagado(e.target.value)}
                placeholder="Ingrese el monto"
                autoFocus
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 18
                }}
              />
            </div>

            {montoPagado && parseFloat(montoPagado) >= calcularTotal() && (
              <div style={{
                background: '#e8f5e9',
                padding: 16,
                borderRadius: 8,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>Vuelto:</span>
                  <span style={{ fontSize: 20, fontWeight: 'bold', color: '#2e7d32' }}>
                    ${(parseFloat(montoPagado) - calcularTotal()).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={confirmarPagoEfectivo}
                disabled={loading || !montoPagado || parseFloat(montoPagado) < calcularTotal()}
                style={{
                  flex: 1,
                  background: loading || !montoPagado || parseFloat(montoPagado) < calcularTotal() ? '#ccc' : '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: loading || !montoPagado || parseFloat(montoPagado) < calcularTotal() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
              <button
                onClick={() => {
                  setMostrarModalEfectivo(false);
                  setMontoPagado('');
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

      {/* Modal Datos de Tarjeta */}
      {mostrarModalTarjeta && (
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
            width: 450,
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: '#80001c', marginBottom: 24 }}>
              Datos de la Tarjeta {metodoPago === 'TARJETA_CREDITO' ? 'de Crédito' : 'de Débito'}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                Número de Tarjeta
              </label>
              <input
                type="text"
                value={datosTarjeta.numero}
                onChange={(e) => setDatosTarjeta({...datosTarjeta, numero: formatearNumeroTarjeta(e.target.value)})}
                placeholder="1234567890123456"
                maxLength="16"
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 16
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                Titular de la Tarjeta
              </label>
              <input
                type="text"
                value={datosTarjeta.titular}
                onChange={(e) => setDatosTarjeta({...datosTarjeta, titular: e.target.value.toUpperCase()})}
                placeholder="NOMBRE COMPLETO"
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 16
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  Vencimiento
                </label>
                <input
                  type="text"
                  value={datosTarjeta.vencimiento}
                  onChange={(e) => setDatosTarjeta({...datosTarjeta, vencimiento: formatearVencimiento(e.target.value)})}
                  placeholder="MM/AA"
                  maxLength="5"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 16
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                  CVV
                </label>
                <input
                  type="password"
                  value={datosTarjeta.cvv}
                  onChange={(e) => setDatosTarjeta({...datosTarjeta, cvv: e.target.value.replace(/\D/g, '').substring(0, 3)})}
                  placeholder="123"
                  maxLength="3"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 16
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={confirmarPagoTarjeta}
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? '#ccc' : '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 24px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
              <button
                onClick={() => setMostrarModalTarjeta(false)}
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

      {/* Modal Confirmar Eliminación */}
      {mostrarModalEliminar && ventaAEliminar && (
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
              ¿Está seguro que desea eliminar la venta <strong>#{ventaAEliminar.id}</strong> por un total de <strong>${ventaAEliminar.total?.toFixed(2)}</strong>?
            </p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              Esta acción restaurará el stock de los productos vendidos.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={eliminarVenta}
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
                  setVentaAEliminar(null);
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

export default Ventas;