import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== USUARIOS ====================
export const usuariosAPI = {
  login: (username, password) => 
    api.post('/api/usuarios/login', { username, password }),
  
  register: (userData) => 
    api.post('/api/usuarios/register', userData),
  
  getAll: () => 
    api.get('/api/usuarios/all'),
  
  update: (id, data) => 
    api.put(`/api/usuarios/${id}`, data),
  
  delete: (id) => 
    api.delete(`/api/usuarios/${id}`),
};

// ==================== PRODUCTOS ====================
export const productosAPI = {
  getAll: () => 
    api.get('/api/productos'),
  
  getById: (id) => 
    api.get(`/api/productos/${id}`),
  
  create: (producto) => 
    api.post('/api/productos', producto),
  
  update: (id, producto) => 
    api.put(`/api/productos/${id}`, producto),
  
  updateMargen: (id, margen) => 
    api.put(`/api/productos/${id}/margen`, { margen }),
  
  delete: (id) => 
    api.delete(`/api/productos/${id}`),
};

// ==================== VENTAS ====================
export const ventasAPI = {
  getAll: () => 
    api.get('/api/ventas'),
  
  create: (venta) => 
    api.post('/api/ventas', venta),
  
  update: (id, venta) => 
    api.put(`/api/ventas/${id}`, venta),
  
  delete: (id) => 
    api.delete(`/api/ventas/${id}`),
  
  getByDateRange: (desde, hasta) => 
    api.get('/api/ventas', { params: { desde, hasta } }),
  
  getHoy: () => 
    api.get('/api/ventas/hoy'),
  
  getById: (id) => 
    api.get(`/api/ventas/${id}`),
  
  // ✅ Exporta PDF COMPLETO con detalle de productos (para pantalla VENTAS)
  exportPDF: (desde = null, hasta = null) => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    
    return api.get('/api/ventas/exportar/pdf', { 
      params,
      responseType: 'blob' 
    });
  },
  
  // ✅ Exporta Excel COMPLETO con detalle de productos (para pantalla VENTAS)
  exportExcel: (desde = null, hasta = null) => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    
    return api.get('/api/ventas/exportar/excel', { 
      params,
      responseType: 'blob' 
    });
  },

  // ✅ NUEVO: Exporta PDF RESUMEN (sin detalle de productos) - Para pantalla REPORTES
  exportResumenPDF: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/resumen-ventas/pdf', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },

  // ✅ Exportar productos más vendidos a PDF
  exportProductosMasVendidosPDF: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/productos-mas-vendidos/pdf', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },

  // ✅ Exportar productos más vendidos a Excel
  exportProductosMasVendidosExcel: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/productos-mas-vendidos/excel', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },

  generarReportePDF: function(desde = null, hasta = null) {
    return this.exportPDF(desde, hasta);
  },
};

// ==================== CAJA ====================
export const cajaAPI = {
  abrir: (data) => 
    api.post('/api/caja/abrir', data),
  
  cerrar: (data) => 
    api.post('/api/caja/cerrar', data),
  
  getEstado: () => 
    api.get('/api/caja/estado'),
  
  getHistorial: () => 
    api.get('/api/caja/historial'),
};

// ==================== REPORTES ====================
export const reportesAPI = {
  getVentas: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/ventas', { 
      params: { fechaInicio, fechaFin } 
    }),
  
  getVentasPorDia: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/ventas/por-dia', { 
      params: { fechaInicio, fechaFin } 
    }),
  
  getVentasPorPeriodo: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/grafico/ventas-por-periodo', { 
      params: { fechaInicio, fechaFin } 
    }),
  
  getProductosMasVendidos: (fechaInicio, fechaFin, top = 10) => 
    api.get('/api/reportes/grafico/productos-mas-vendidos', { 
      params: { fechaInicio, fechaFin, top } 
    }),
  
  getVentasPorMetodoPago: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/ventas/por-metodo-pago', { 
      params: { fechaInicio, fechaFin } 
    }),
  
  getVentasPorCategoria: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/ventas/por-categoria', { 
      params: { fechaInicio, fechaFin } 
    }),
  
  getResumen: (fechaInicio, fechaFin) => 
    api.get('/api/reportes/resumen', { 
      params: { fechaInicio, fechaFin } 
    }),

  // ✅ NUEVO: Exportar RESUMEN de ventas a PDF (sin detalle de productos)
  exportResumenVentasPDF: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/resumen-ventas/pdf', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },

  // ✅ Exportar productos más vendidos a PDF
  exportProductosMasVendidosPDF: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/productos-mas-vendidos/pdf', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },

  // ✅ Exportar productos más vendidos a Excel
  exportProductosMasVendidosExcel: (fechaInicio, fechaFin) => {
    return api.get('/api/reportes/exportar/productos-mas-vendidos/excel', {
      params: { fechaInicio, fechaFin },
      responseType: 'blob'
    });
  },
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getResumen: () => 
    api.get('/api/dashboard/resumen'),
  
  getVentasPorMetodoPago: (fecha) => 
    api.get('/api/dashboard/ventas-por-metodo-pago', { 
      params: { fecha } 
    }),
  
  getProductosMasVendidos: (fechaInicio, fechaFin) => 
    api.get('/api/dashboard/productos-mas-vendidos', {
      params: { fechaInicio, fechaFin }
    }),
  
  getProductosStockBajo: () => 
    api.get('/api/dashboard/productos-stock-bajo'),
  
  getVentasUltimosDias: (dias = 7) => 
    api.get('/api/dashboard/ventas-ultimos-dias', {
      params: { dias }
    }),
};

export default api;