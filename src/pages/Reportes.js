import React, { useState, useEffect } from 'react';
import { ventasAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Reportes() {
  const [ventas, setVentas] = useState([]);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasPorMetodo, setVentasPorMetodo] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 7);
    return fecha.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const COLORS = ['#80001c', '#d32f2f', '#f57c00', '#1976d2', '#388e3c'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      console.log('=== CARGANDO REPORTES ===');
      console.log('Fecha inicio:', fechaInicio);
      console.log('Fecha fin:', fechaFin);
      
      const responseVentas = await ventasAPI.getAll();
      const todasLasVentas = responseVentas.data;
      
      const inicio = new Date(fechaInicio + 'T00:00:00');
      const fin = new Date(fechaFin + 'T23:59:59');
      
      const ventasFiltradas = todasLasVentas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
      
      console.log('✅ Ventas filtradas:', ventasFiltradas.length);
      
      setVentas(ventasFiltradas);
      procesarVentasPorDia(ventasFiltradas);
      procesarVentasPorMetodo(ventasFiltradas);
      procesarTopProductos(ventasFiltradas);
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const procesarVentasPorDia = (ventasFiltradas) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    const ventasPorFecha = {};
    
    let currentDate = new Date(inicio);
    while (currentDate <= fin) {
      const fechaStr = currentDate.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit'
      });
      ventasPorFecha[fechaStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha).toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit'
      });
      if (ventasPorFecha.hasOwnProperty(fecha)) {
        ventasPorFecha[fecha] += venta.total;
      }
    });

    const datos = Object.entries(ventasPorFecha)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => {
        const [diaA, mesA] = a.fecha.split('/');
        const [diaB, mesB] = b.fecha.split('/');
        const fechaA = new Date(new Date().getFullYear(), mesA - 1, diaA);
        const fechaB = new Date(new Date().getFullYear(), mesB - 1, diaB);
        return fechaA - fechaB;
      });

    console.log('📊 Ventas por día:', datos);
    setVentasPorDia(datos);
  };

  const procesarVentasPorMetodo = (ventasFiltradas) => {
    const metodos = {};
    
    ventasFiltradas.forEach(venta => {
      const metodo = venta.metodoPago || 'SIN_ESPECIFICAR';
      if (!metodos[metodo]) {
        metodos[metodo] = { nombre: metodo, total: 0, cantidad: 0 };
      }
      metodos[metodo].total += venta.total;
      metodos[metodo].cantidad += 1;
    });

    const datos = Object.values(metodos).map(metodo => ({
      name: formatearMetodoPago(metodo.nombre),
      value: metodo.total,
      cantidad: metodo.cantidad
    }));

    setVentasPorMetodo(datos);
  };

  const procesarTopProductos = (ventasFiltradas) => {
    const productos = {};
    
    ventasFiltradas.forEach(venta => {
      if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach(detalle => {
          const nombreProducto = detalle.producto?.nombre || 'Producto Desconocido';
          if (!productos[nombreProducto]) {
            productos[nombreProducto] = { nombre: nombreProducto, cantidad: 0, total: 0 };
          }
          productos[nombreProducto].cantidad += detalle.cantidad;
          productos[nombreProducto].total += detalle.subtotal;
        });
      }
    });

    const top = Object.values(productos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

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

const exportarPDF = async () => {
  try {
    // ✅ Convertir fechas a formato LocalDate (YYYY-MM-DD)
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    const fechaInicioISO = fechaInicioDate.toISOString().split('T')[0];
    const fechaFinISO = fechaFinDate.toISOString().split('T')[0];
    
    console.log('📄 Exportando RESUMEN PDF:', { fechaInicioISO, fechaFinISO });
    
    // ✅ CAMBIO: Usar exportResumenPDF en vez de exportPDF
    const response = await ventasAPI.exportResumenPDF(fechaInicioISO, fechaFinISO);
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumen_ventas_${fechaInicio}_${fechaFin}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('✅ PDF de resumen descargado exitosamente');
  } catch (error) {
    console.error('❌ Error al exportar PDF:', error);
    alert('❌ Error al generar el PDF: ' + (error.response?.data?.message || error.message));
  }
};

  const exportarExcel = async () => {
    try {
      const fechaInicioISO = new Date(fechaInicio + 'T00:00:00').toISOString();
      const fechaFinISO = new Date(fechaFin + 'T23:59:59').toISOString();
      
      console.log('📊 Exportando Excel:', { fechaInicioISO, fechaFinISO });
      
      const response = await ventasAPI.exportExcel(fechaInicioISO, fechaFinISO);
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_ventas_${fechaInicio}_${fechaFin}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('✅ Excel descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar Excel:', error);
      alert('❌ Error al generar el Excel: ' + (error.response?.data?.message || error.message));
    }
  };

  const calcularTotalVentas = () => {
    return ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  };

  const renderLabelMetodo = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ 
          fontWeight: 'bold', 
          fontSize: '14px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // ✅ MEJORADO: Acorta nombres largos de productos
  const renderLabelProducto = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // ✅ Acortar nombre si es muy largo
    const nombreCorto = payload.nombre.length > 15 
      ? payload.nombre.substring(0, 12) + '...' 
      : payload.nombre;

    return (
      <text 
        x={x} 
        y={y} 
        fill="#333" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: '600' }}
      >
        {`${nombreCorto} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  const CustomTooltipMetodo = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalVentas = ventasPorMetodo.reduce((sum, m) => sum + m.value, 0);
      const porcentaje = ((data.value / totalVentas) * 100).toFixed(1);
      
      return (
        <div style={{
          background: '#fff',
          border: '2px solid #80001c',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#80001c' }}>
            {data.name}
          </p>
          <p style={{ margin: 0, color: '#333' }}>
            Total: <strong>${data.value.toFixed(2)}</strong>
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
            Ventas: {data.payload.cantidad}
          </p>
          <p style={{ margin: 0, color: '#80001c', fontWeight: 'bold', fontSize: 15 }}>
            {porcentaje}%
          </p>
        </div>
      );
    }
    return null;
  };

  // ✅ MEJORADO: Tooltip muestra nombre completo
  const CustomTooltipProducto = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalCantidad = productosTop.reduce((sum, p) => sum + p.cantidad, 0);
      const porcentaje = ((data.value / totalCantidad) * 100).toFixed(1);
      
      return (
        <div style={{
          background: '#fff',
          border: '2px solid #80001c',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '250px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: 4, color: '#80001c' }}>
            {data.payload.nombre}
          </p>
          <p style={{ margin: 0, color: '#333' }}>
            Cantidad: <strong>{data.value}</strong>
          </p>
          <p style={{ margin: 0, color: '#80001c', fontWeight: 'bold', fontSize: 15 }}>
            {porcentaje}%
          </p>
        </div>
      );
    }
    return null;
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
        <div style={{ fontSize: 24, color: '#80001c', fontWeight: 'bold' }}>⏳ Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fcebe6', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#80001c', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
            📈 Reportes
          </h1>
          <p style={{ color: '#666', fontSize: 16 }}>
            Análisis detallado y exportación de datos
          </p>
        </div>

        {/* ✅ FILTROS CON BOTONES RÁPIDOS */}
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

          {/* ✅ BOTONES RÁPIDOS */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            flexWrap: 'wrap',
            paddingTop: 16,
            paddingBottom: 16,
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee'
          }}>
            {['hoy', 'semana', 'mes', 'todo'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => aplicarFiltroRapido(tipo)}
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
                {tipo === 'hoy' ? 'Hoy' : 
                 tipo === 'semana' ? 'Última Semana' : 
                 tipo === 'mes' ? 'Último Mes' : 'Todo'}
              </button>
            ))}
          </div>

          <div style={{
            padding: 12,
            background: '#e3f2fd',
            borderRadius: 8,
            fontSize: 14,
            color: '#1976d2',
            fontWeight: '500',
            marginTop: 16,
            marginBottom: 16
          }}>
            📊 Mostrando datos desde <strong>{new Date(fechaInicio).toLocaleDateString('es-AR')}</strong> hasta <strong>{new Date(fechaFin).toLocaleDateString('es-AR')}</strong>
            <br/>
            📈 Total: <strong>${calcularTotalVentas().toFixed(2)}</strong> en {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={exportarPDF}
              disabled={ventas.length === 0}
              style={{
                flex: 1,
                background: ventas.length === 0 ? '#ccc' : '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 24px',
                fontWeight: 'bold',
                cursor: ventas.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 15,
                transition: 'all 0.3s ease',
                boxShadow: ventas.length === 0 ? 'none' : '0 2px 8px rgba(211, 47, 47, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (ventas.length > 0) {
                  e.target.style.background = '#b71c1c';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (ventas.length > 0) {
                  e.target.style.background = '#d32f2f';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(211, 47, 47, 0.3)';
                }
              }}
            >
              📄 Exportar PDF
            </button>

            <button
              onClick={exportarExcel}
              disabled={ventas.length === 0}
              style={{
                flex: 1,
                background: ventas.length === 0 ? '#ccc' : '#388e3c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 24px',
                fontWeight: 'bold',
                cursor: ventas.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 15,
                transition: 'all 0.3s ease',
                boxShadow: ventas.length === 0 ? 'none' : '0 2px 8px rgba(56, 142, 60, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (ventas.length > 0) {
                  e.target.style.background = '#2e7d32';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(56, 142, 60, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (ventas.length > 0) {
                  e.target.style.background = '#388e3c';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(56, 142, 60, 0.3)';
                }
              }}
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        {ventas.length === 0 ? (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: 40,
            borderRadius: 12,
            border: '2px solid #ffeeba',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
              No hay datos para mostrar
            </div>
            <div style={{ fontSize: 15, color: '#664d03' }}>
              Selecciona un rango de fechas con ventas registradas o utiliza los filtros rápidos
            </div>
          </div>
        ) : (
          <>
            {/* Gráfico de barras: Ventas por día */}
            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: 24
            }}>
              <h3 style={{ color: '#80001c', marginBottom: 20, fontWeight: 'bold', fontSize: 20 }}>
                📊 Ventas por Día
              </h3>
              {ventasPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ventasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="fecha" 
                      style={{ fontSize: 13, fontWeight: '500' }}
                    />
                    <YAxis 
                      style={{ fontSize: 13 }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value.toFixed(2)}`}
                      contentStyle={{
                        background: '#fff',
                        border: '2px solid #80001c',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      fill="#80001c" 
                      name="Total Ventas"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                  Sin datos
                </div>
              )}
            </div>

            {/* Gráficos circulares */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* Gráfico: Ventas por Método de Pago */}
              <div style={{
                background: '#fff',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#80001c', marginBottom: 20, fontWeight: 'bold', fontSize: 20 }}>
                  💳 Ventas por Método de Pago
                </h3>
                {ventasPorMetodo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={ventasPorMetodo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabelMetodo}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ventasPorMetodo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipMetodo />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => entry.payload.name}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    Sin datos
                  </div>
                )}
              </div>

              {/* ✅ MEJORADO: Gráfico de productos con nombres acortados */}
              <div style={{
                background: '#fff',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#80001c', marginBottom: 20, fontWeight: 'bold', fontSize: 20 }}>
                  🏆 Top 5 Productos Más Vendidos
                </h3>
                {productosTop.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={productosTop}
                        cx="50%"
                        cy="45%"
                        labelLine={true}
                        label={renderLabelProducto}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {productosTop.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipProducto />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    Sin datos
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default Reportes;