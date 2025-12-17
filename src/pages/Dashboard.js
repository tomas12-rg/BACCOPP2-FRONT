import React, { useState, useEffect } from 'react';
import { ventasAPI, cajaAPI } from '../services/api';

function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [ventasPorMetodo, setVentasPorMetodo] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // ✅ FUNCIÓN PARA FORMATEAR MONEDA ARGENTINA
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  useEffect(() => {
    cargarDatos();
    verificarCaja();
  }, []);

  const verificarCaja = async () => {
    try {
      const response = await cajaAPI.getEstado();
      setCajaAbierta(response.data.abierta);
    } catch (error) {
      console.error('Error al verificar caja:', error);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      console.log('=== CARGANDO DASHBOARD ===');
      console.log('Fecha inicio:', fechaInicio);
      console.log('Fecha fin:', fechaFin);
      
      const responseVentas = await ventasAPI.getAll();
      const todasLasVentas = responseVentas.data;
      
      console.log('Total ventas en BD:', todasLasVentas.length);
      
      if (todasLasVentas.length > 0) {
        console.log('Primera venta:', todasLasVentas[0]);
      }
      
      const inicio = new Date(fechaInicio + 'T00:00:00');
      const fin = new Date(fechaFin + 'T23:59:59');
      
      console.log('Rango de filtrado:');
      console.log('- Inicio:', inicio.toISOString());
      console.log('- Fin:', fin.toISOString());
      
      const ventasFiltradas = todasLasVentas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        const dentroDelRango = fechaVenta >= inicio && fechaVenta <= fin;
        
        if (todasLasVentas.length <= 10) {
          console.log(`Venta #${venta.id}:`, {
            fechaOriginal: venta.fecha,
            fechaParsed: fechaVenta.toLocaleString('es-AR'),
            dentroDelRango
          });
        }
        
        return dentroDelRango;
      });
      
      console.log('✅ Ventas filtradas:', ventasFiltradas.length);
      
      setVentas(ventasFiltradas);
      procesarVentasPorMetodo(ventasFiltradas);
      procesarTopProductos(ventasFiltradas);
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarVentasPorMetodo = (ventasFiltradas) => {
    const metodos = {};
    
    ventasFiltradas.forEach(venta => {
      const metodo = venta.metodoPago || 'SIN_ESPECIFICAR';
      if (!metodos[metodo]) {
        metodos[metodo] = { nombre: metodo, total: 0, cantidad: 0 };
      }
      metodos[metodo].total += venta.total || 0;
      metodos[metodo].cantidad += 1;
    });

    const datos = Object.values(metodos)
      .map(metodo => ({
        nombre: formatearMetodoPago(metodo.nombre),
        total: metodo.total,
        cantidad: metodo.cantidad
      }))
      .sort((a, b) => b.total - a.total);

    console.log('Ventas por método:', datos);
    setVentasPorMetodo(datos);
  };

  const procesarTopProductos = (ventasFiltradas) => {
    const productos = {};
    
    ventasFiltradas.forEach(venta => {
      if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach(detalle => {
          const nombreProducto = detalle.producto?.nombre || 'Producto Desconocido';
          if (!productos[nombreProducto]) {
            productos[nombreProducto] = 0;
          }
          productos[nombreProducto] += detalle.cantidad || 0;
        });
      }
    });

    const top = Object.entries(productos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    console.log('Top productos:', top);
    setProductosTop(top);
  };

  const formatearMetodoPago = (metodo) => {
    const formatos = {
      'EFECTIVO': 'Efectivo',
      'TARJETA_DEBITO': 'Tarjeta Débito',
      'TARJETA_CREDITO': 'Tarjeta Crédito',
      'TRANSFERENCIA': 'Transferencia',
      'MERCADO_PAGO': 'Mercado Pago',
      'SIN_ESPECIFICAR': 'Sin Especificar'
    };
    return formatos[metodo] || metodo;
  };

  const calcularTotalVentas = () => {
    return ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  };

  const calcularTicketPromedio = () => {
    if (ventas.length === 0) return 0;
    return calcularTotalVentas() / ventas.length;
  };

  const calcularGanancia = () => {
    let gananciaTotal = 0;
    
    ventas.forEach(venta => {
      if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach(detalle => {
          const precioVenta = detalle.precioUnitario || 0;
          const precioCosto = detalle.producto?.costo || 0;
          const cantidad = detalle.cantidad || 0;
          
          const gananciaProducto = (precioVenta - precioCosto) * cantidad;
          gananciaTotal += gananciaProducto;
        });
      }
    });
    
    return gananciaTotal;
  };

  const aplicarFiltroRapido = (tipo) => {
    const hoy = new Date();
    let desde = new Date();

    switch (tipo) {
      case 'hoy':
        desde = hoy;
        break;
      case 'semana':
        desde.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        desde.setMonth(hoy.getMonth() - 1);
        break;
      case 'todo':
        desde = new Date('2020-01-01');
        break;
      default:
        desde = hoy;
    }

    setFechaInicio(desde.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div style={{ 
        background: '#fcebe6', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ fontSize: 24, color: '#80001c', fontWeight: 'bold' }}>⏳ Cargando datos...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fcebe6', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#80001c', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
            📊 Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: 16 }}>
            Panel de control y estadísticas
          </p>
        </div>

        {cajaAbierta === false && (
          <div style={{
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: '#fff',
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            border: '2px solid #ef6c00'
          }}>
            <div style={{ fontSize: 32 }}>🔴</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>
                Caja Cerrada
              </div>
              <div style={{ fontSize: 14, opacity: 0.95 }}>
                No se pueden realizar ventas. Dirígete a "Caja" para abrir el turno.
              </div>
            </div>
          </div>
        )}

        {/* FILTROS CON BOTONES RÁPIDOS */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
                📅 Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                max={fechaFin}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>
                📅 Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={fechaInicio}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16
                }}
              />
            </div>

            <button
              onClick={cargarDatos}
              style={{
                padding: '12px 32px',
                background: '#80001c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(128,0,28,0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.background = '#a00023'}
              onMouseOut={(e) => e.target.style.background = '#80001c'}
            >
              🔍 Filtrar
            </button>
          </div>

          {/* BOTONES RÁPIDOS */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            flexWrap: 'wrap',
            paddingTop: 16,
            borderTop: '1px solid #eee'
          }}>
            <button
              onClick={() => aplicarFiltroRapido('hoy')}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: '#80001c',
                border: '2px solid #80001c',
                borderRadius: 8,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: 14
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#80001c';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#80001c';
              }}
            >
              Hoy
            </button>

            <button
              onClick={() => aplicarFiltroRapido('semana')}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: '#80001c',
                border: '2px solid #80001c',
                borderRadius: 8,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: 14
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#80001c';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#80001c';
              }}
            >
              Última Semana
            </button>

            <button
              onClick={() => aplicarFiltroRapido('mes')}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: '#80001c',
                border: '2px solid #80001c',
                borderRadius: 8,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: 14
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#80001c';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#80001c';
              }}
            >
              Último Mes
            </button>

            <button
              onClick={() => aplicarFiltroRapido('todo')}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: '#80001c',
                border: '2px solid #80001c',
                borderRadius: 8,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: 14
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#80001c';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#80001c';
              }}
            >
              Todo
            </button>
          </div>
          
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: '#e3f2fd', 
            borderRadius: 8,
            fontSize: 14,
            color: '#1976d2',
            fontWeight: '500'
          }}>
            📅 Mostrando datos desde <strong>{new Date(fechaInicio).toLocaleDateString('es-AR')}</strong> hasta <strong>{new Date(fechaFin).toLocaleDateString('es-AR')}</strong>
          </div>
        </div>

        {ventas.length === 0 && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: 30,
            borderRadius: 12,
            marginBottom: 24,
            border: '2px solid #ffeeba',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
              No hay ventas en este período
            </div>
            <div style={{ fontSize: 15, color: '#664d03' }}>
              Intenta seleccionar un rango de fechas diferente o utiliza los filtros rápidos.
            </div>
          </div>
        )}

        {/* ✅ TARJETAS DE RESUMEN CON FORMATO DE MONEDA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #80001c'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>💰 Total Ventas</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#80001c' }}>
              {formatearMoneda(calcularTotalVentas())}
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #1976d2'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>🧾 Cantidad Ventas</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1976d2' }}>
              {ventas.length}
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f57c00'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>📊 Ticket Promedio</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f57c00' }}>
              {formatearMoneda(calcularTicketPromedio())}
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #388e3c'
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>💵 Ganancia</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#388e3c' }}>
              {formatearMoneda(calcularGanancia())}
            </div>
          </div>
        </div>

        {/* ✅ GRÁFICOS CON FORMATO DE MONEDA */}
        {ventas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#80001c', marginBottom: 20, fontWeight: 'bold' }}>
                💳 Ventas por Método de Pago
              </h3>
              {ventasPorMetodo.length > 0 ? (
                <div>
                  {ventasPorMetodo.map((metodo, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: index < ventasPorMetodo.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: 16 }}>
                          {metodo.nombre}
                        </div>
                        <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                          {metodo.cantidad} {metodo.cantidad === 1 ? 'venta' : 'ventas'}
                        </div>
                      </div>
                      <div style={{
                        background: '#fcebe6',
                        color: '#80001c',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontWeight: 'bold',
                        fontSize: 18
                      }}>
                        {formatearMoneda(metodo.total)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  Sin datos
                </div>
              )}
            </div>

            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#80001c', marginBottom: 20, fontWeight: 'bold' }}>
                🍷 Top Productos Vendidos
              </h3>
              {productosTop.length > 0 ? (
                <div>
                  {productosTop.map((producto, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < productosTop.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#80001c',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <span style={{ fontWeight: '500' }}>{producto.nombre}</span>
                      </div>
                      <div style={{
                        background: '#fcebe6',
                        color: '#80001c',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontWeight: 'bold'
                      }}>
                        {producto.cantidad}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  Sin datos
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;