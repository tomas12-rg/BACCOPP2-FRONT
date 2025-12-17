import React, { useState, useEffect } from "react";
import { productosAPI } from '../services/api';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ 
    nombre: "", 
    tipo: "", 
    precio: "", 
    costo: "", 
    margenGanancia: "", // NUEVO
    stock: "", 
    descripcion: "",
    categoria: "" 
  });
  const [editId, setEditId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });
  const [busqueda, setBusqueda] = useState("");
  const [mostrarListado, setMostrarListado] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      showToast("No se pudieron cargar los productos", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: "", type: "success" }), 3000);
  };

  // MODIFICADO: Cálculo automático del precio
  const handleForm = e => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    // Si cambia el costo o el margen, recalcular el precio automáticamente
    if (name === 'costo' || name === 'margenGanancia') {
      const costo = parseFloat(name === 'costo' ? value : form.costo) || 0;
      const margen = parseFloat(name === 'margenGanancia' ? value : form.margenGanancia) || 0;
      
      if (costo > 0 && margen >= 0) {
        const precioCalculado = costo * (1 + margen / 100);
        newForm.precio = precioCalculado.toFixed(2);
      }
    }

    setForm(newForm);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio || !form.costo || !form.stock || !form.tipo || !form.categoria) {
      showToast("⚠️ Completa todos los campos obligatorios", "error");
      return;
    }

    // VALIDACIÓN: Verificar si hay pérdida
    if (parseFloat(form.precio) < parseFloat(form.costo)) {
      const confirmacion = window.confirm(
        '⚠️ ADVERTENCIA: El precio de venta ($' + form.precio + ') es menor al costo ($' + form.costo + ').\n' +
        'Esto generará una PÉRDIDA de $' + (parseFloat(form.costo) - parseFloat(form.precio)).toFixed(2) + '\n\n' +
        '¿Desea continuar de todas formas?'
      );
      if (!confirmacion) return;
    }

    try {
      setLoading(true);
      const body = {
        nombre: form.nombre,
        tipo: form.tipo,
        precio: Number(form.precio),
        costo: Number(form.costo),
        margenGanancia: form.margenGanancia ? Number(form.margenGanancia) : null, // NUEVO
        stock: parseInt(form.stock, 10),
        descripcion: form.descripcion,
        categoria: form.categoria
      };

      if (editId) {
        await productosAPI.update(editId, body);
        showToast("✅ Producto actualizado correctamente", "success");
      } else {
        await productosAPI.create(body);
        showToast("✅ Producto agregado correctamente", "success");
      }
      
      setForm({ nombre: "", tipo: "", precio: "", costo: "", margenGanancia: "", stock: "", descripcion: "", categoria: "" });
      setEditId(null);
      setMostrarForm(false);
      cargarProductos();
    } catch (error) {
      showToast("❌ " + (error.response?.data?.error || "Error al guardar producto"), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const editarProducto = prod => {
    setEditId(prod.id);
    
    // CALCULAR MARGEN ACTUAL
    const margenCalculado = prod.costo > 0 
      ? ((prod.precio - prod.costo) / prod.costo * 100).toFixed(2)
      : 0;

    setForm({
      nombre: prod.nombre,
      tipo: prod.tipo,
      precio: prod.precio.toString(),
      costo: prod.costo.toString(),
      margenGanancia: margenCalculado,
      stock: prod.stock.toString(),
      descripcion: prod.descripcion || "",
      categoria: prod.categoria || "",
    });
    setMostrarForm(true);
  };

  const eliminarProducto = async id => {
    if (!window.confirm("¿Estás seguro que deseas eliminar este producto?")) return;
    try {
      await productosAPI.delete(id);
      showToast("🗑️ Producto eliminado correctamente", "success");
      cargarProductos();
    } catch (error) {
      showToast("❌ Error al eliminar producto", "error");
      console.error(error);
    }
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setForm({ nombre: "", tipo: "", precio: "", costo: "", margenGanancia: "", stock: "", descripcion: "", categoria: "" });
    setMostrarForm(false);
  };

  const productosFiltrados = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    prod.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (prod.categoria && prod.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const getToastStyles = (type) => {
    const baseStyle = {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "16px 24px",
      borderRadius: 12,
      fontWeight: "bold",
      fontSize: "1rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 300,
      animation: "slideIn 0.3s ease-out",
      border: "2px solid"
    };

    switch(type) {
      case "success":
        return { ...baseStyle, background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)", color: "#fff", borderColor: "#2e7d32" };
      case "error":
        return { ...baseStyle, background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)", color: "#fff", borderColor: "#c62828" };
      case "info":
        return { ...baseStyle, background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)", color: "#fff", borderColor: "#1565c0" };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{ background: "#fcebe6", minHeight: "100vh", padding: 24 }}>
      <style>
        {`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .btn-action {
          transition: background 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .btn-action:hover {
          background: #a80024 !important;
          transform: translateY(-2px) scale(1.04);
        }
        .btn-delete:hover {
          background: #b71c1c !important;
        }
        .badge-margen {
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 13px;
          display: inline-block;
        }
        .badge-margen.positivo {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .badge-margen.negativo {
          background: #ffebee;
          color: #d32f2f;
        }
        `}
      </style>

      {toast.show && (
        <div style={getToastStyles(toast.type)}>
          <span style={{ fontSize: 24 }}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
          </span>
          <span>{toast.text}</span>
        </div>
      )}

      <div style={{ background: "#fff6f2", maxWidth: 1100, margin: "0 auto", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#6d0019", marginBottom: 0 }}>Gestión de Productos</h2>
            <div style={{ color: "#888", fontSize: 16 }}>Administra el inventario de tu vinoteca</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setMostrarForm(true);
                setEditId(null);
                setForm({ nombre: "", tipo: "", precio: "", costo: "", margenGanancia: "", stock: "", descripcion: "", categoria: "" });
              }}
              className="btn-action"
              style={{
                background: "#80001c",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 20px",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              Agregar Producto
            </button>
            <button
              onClick={() => setMostrarListado(true)}
              className="btn-action"
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 20px",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              Emitir Listado
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Consultar producto por nombre, tipo o categoría..."
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 6,
              border: "1px solid #fcebe6",
              fontSize: "1rem"
            }}
          />
        </div>

        {mostrarListado && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.2)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000
          }}>
            <div style={{
              background: "#fff", borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              padding: 24, minWidth: 350, maxWidth: 600, position: "relative"
            }}>
              <button
                onClick={() => setMostrarListado(false)}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "none", border: "none",
                  fontSize: 22, color: "#1976d2", cursor: "pointer"
                }}
              >×</button>
              <h3 style={{ color: "#1976d2", fontWeight: "bold", marginBottom: 18 }}>
                Listado de Productos
              </h3>
              <ul style={{ maxHeight: 400, overflowY: "auto", padding: 0, margin: 0 }}>
                {productos.length === 0 ? (
                  <li style={{ textAlign: "center", color: "#888" }}>No hay productos</li>
                ) : (
                  productos.map(prod => (
                    <li key={prod.id} style={{ marginBottom: 10, listStyle: "none", borderBottom: "1px solid #eee", paddingBottom: 6 }}>
                      <b>{prod.nombre}</b> ({prod.tipo}) - {prod.categoria} - Precio: ${prod.precio} - Stock: {prod.stock}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}

        {!mostrarForm && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", background: "#fff", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fcebe6" }}>
                  <th style={{ padding: 8 }}>ID</th>
                  <th style={{ padding: 8 }}>Nombre</th>
                  <th style={{ padding: 8 }}>Tipo</th>
                  <th style={{ padding: 8 }}>Categoría</th>
                  <th style={{ padding: 8 }}>Costo</th>
                  <th style={{ padding: 8 }}>Precio</th>
                  <th style={{ padding: 8 }}>Margen %</th>
                  <th style={{ padding: 8 }}>Stock</th>
                  <th style={{ padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 16 }}>Cargando...</td></tr>
                ) : productosFiltrados.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: "center", padding: 16 }}>No hay productos</td></tr>
                ) : (
                  productosFiltrados.map(prod => {
                    const margen = prod.costo > 0 ? ((prod.precio - prod.costo) / prod.costo * 100).toFixed(2) : 0;
                    const esRentable = prod.precio >= prod.costo;
                    
                    return (
                      <tr key={prod.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: 8 }}>{prod.id}</td>
                        <td style={{ padding: 8 }}><strong>{prod.nombre}</strong></td>
                        <td style={{ padding: 8 }}>{prod.tipo}</td>
                        <td style={{ padding: 8 }}>{prod.categoria || '-'}</td>
                        <td style={{ padding: 8 }}>${prod.costo.toFixed(2)}</td>
                        <td style={{ padding: 8 }}><strong>${prod.precio.toFixed(2)}</strong></td>
                        <td style={{ padding: 8, textAlign: "center" }}>
                          <span className={`badge-margen ${esRentable ? 'positivo' : 'negativo'}`}>
                            {esRentable ? '+' : ''}{margen}%
                          </span>
                        </td>
                        <td style={{ padding: 8 }}>{prod.stock}</td>
                        <td style={{ padding: 8 }}>
                          <button
                            onClick={() => editarProducto(prod)}
                            className="btn-action"
                            style={{
                              background: "#6d0019", color: "#fff",
                              border: "none", borderRadius: 4,
                              padding: "4px 12px", marginRight: 6, fontWeight: "bold"
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarProducto(prod.id)}
                            className="btn-action btn-delete"
                            style={{
                              background: "#d32f2f", color: "#fff",
                              border: "none", borderRadius: 4,
                              padding: "4px 12px", fontWeight: "bold"
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {mostrarForm && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000
          }}>
            <div style={{
              background: "#fff", borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              padding: 24, minWidth: 350, maxWidth: 500,
              maxHeight: "90vh", overflowY: "auto", position: "relative"
            }}>
              <button
                onClick={cancelarEdicion}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "none", border: "none",
                  fontSize: 22, color: "#80001c", cursor: "pointer"
                }}
              >×</button>
              
              <form onSubmit={guardarProducto}>
                <h3 style={{ color: "#6d0019", fontWeight: "bold", marginBottom: 18 }}>
                  {editId ? "Editar Producto" : "Agregar Producto"}
                </h3>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: "bold" }}>Nombre del Producto *</label>
                  <input
                    name="nombre"
                    placeholder="Ej: Fernet Branca 750ml"
                    value={form.nombre}
                    onChange={handleForm}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 6,
                      border: "1px solid #fcebe6", marginTop: 4, marginBottom: 8, background: "#fff"
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: "bold" }}>Tipo *</label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleForm}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 6,
                      border: "1px solid #fcebe6", marginTop: 4, marginBottom: 8, background: "#fff"
                    }}
                    required
                  >
                    <option value="">Seleccione tipo de producto</option>
                    <optgroup label="Vinos Tintos">
                      <option value="Malbec">Malbec</option>
                      <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                      <option value="Pinot Noir">Pinot Noir</option>
                      <option value="Merlot">Merlot</option>
                      <option value="Syrah">Syrah</option>
                      <option value="Tinto Blend">Tinto Blend</option>
                    </optgroup>
                    <optgroup label="Vinos Blancos">
                      <option value="Chardonnay">Chardonnay</option>
                      <option value="Sauvignon Blanc">Sauvignon Blanc</option>
                      <option value="Torrontés">Torrontés</option>
                      <option value="Blanco Dulce">Blanco Dulce</option>
                    </optgroup>
                    <optgroup label="Bebidas Blancas">
                      <option value="Vodka">Vodka</option>
                      <option value="Gin">Gin</option>
                      <option value="Ron">Ron</option>
                      <option value="Whisky">Whisky</option>
                      <option value="Tequila">Tequila</option>
                    </optgroup>
                    <optgroup label="Aperitivos">
                      <option value="Fernet">Fernet</option>
                      <option value="Campari">Campari</option>
                      <option value="Aperol">Aperol</option>
                      <option value="Vermouth">Vermouth</option>
                    </optgroup>
                    <optgroup label="Cervezas">
                      <option value="Cerveza Rubia">Cerveza Rubia</option>
                      <option value="Cerveza Roja">Cerveza Roja</option>
                      <option value="Cerveza Negra">Cerveza Negra</option>
                      <option value="IPA">IPA</option>
                      <option value="Cerveza Artesanal">Cerveza Artesanal</option>
                    </optgroup>
                    <optgroup label="Espumantes">
                      <option value="Champagne">Champagne</option>
                      <option value="Espumante">Espumante</option>
                    </optgroup>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: "bold" }}>Categoría *</label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleForm}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 6,
                      border: "1px solid #fcebe6", marginTop: 4, marginBottom: 8, background: "#fff"
                    }}
                    required
                  >
                    <option value="">Seleccione categoría</option>
                    <option value="Vinos Tintos">Vinos Tintos</option>
                    <option value="Vinos Blancos">Vinos Blancos</option>
                    <option value="Bebidas Blancas">Bebidas Blancas</option>
                    <option value="Cervezas">Cervezas</option>
                    <option value="Aperitivos">Aperitivos</option>
                    <option value="Espumantes">Espumantes</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                {/* SECCIÓN DE PRECIOS CON CÁLCULO AUTOMÁTICO */}
                <div style={{
                  background: "#f9f9f9",
                  padding: 16,
                  borderRadius: 8,
                  border: "2px solid #fcebe6",
                  marginBottom: 12
                }}>
                  <h4 style={{ color: "#80001c", marginTop: 0, marginBottom: 12 }}>
                    💰 Configuración de Precios
                  </h4>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontWeight: "bold" }}>Costo Unitario *</label>
                    <input
                      name="costo"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 7000"
                      value={form.costo}
                      onChange={handleForm}
                      disabled={loading}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 6,
                        border: "1px solid #fcebe6", marginTop: 4, marginBottom: 8, background: "#fff"
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontWeight: "bold" }}>Margen de Ganancia (%)</label>
                    <input
                      name="margenGanancia"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 50"
                      value={form.margenGanancia}
                      onChange={handleForm}
                      disabled={loading}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 6,
                        border: "1px solid #fcebe6", marginTop: 4, marginBottom: 4, background: "#fff"
                      }}
                    />
                    <small style={{ color: "#666", fontSize: 12 }}>
                      Calculará automáticamente el precio de venta
                    </small>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontWeight: "bold" }}>Precio de Venta *</label>
                    <input
                      name="precio"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 12000"
                      value={form.precio}
                      onChange={handleForm}
                      disabled={loading}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 6,
                        border: "1px solid #fcebe6", marginTop: 4, marginBottom: 4, background: "#fff"
                      }}
                      required
                    />
                    <small style={{ color: "#666", fontSize: 12 }}>
                      Editable manualmente
                    </small>
                  </div>

                  {/* Indicador de ganancia */}
                  {form.costo && form.precio && (
                    <div style={{
                      padding: 12,
                      background: parseFloat(form.precio) >= parseFloat(form.costo) ? "#e8f5e9" : "#ffebee",
                      borderRadius: 6,
                      textAlign: "center",
                      fontWeight: "bold",
                      color: parseFloat(form.precio) >= parseFloat(form.costo) ? "#2e7d32" : "#d32f2f"
                    }}>
                      {parseFloat(form.precio) >= parseFloat(form.costo) ? (
                        <>
                          ✅ Ganancia: ${(parseFloat(form.precio) - parseFloat(form.costo)).toFixed(2)}
                          {' '}({((parseFloat(form.precio) - parseFloat(form.costo)) / parseFloat(form.costo) * 100).toFixed(2)}%)
                        </>
                      ) : (
                        <>
                          ⚠️ PÉRDIDA: ${(parseFloat(form.costo) - parseFloat(form.precio)).toFixed(2)}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: "bold" }}>Stock *</label>
                  <input
                    name="stock"
                    type="number"
                    placeholder="Ej: 10"
                    value={form.stock}
                    onChange={handleForm}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 6,
                      border: "1px solid #fcebe6", marginTop: 4, marginBottom: 8, background: "#fff"
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontWeight: "bold" }}>Descripción</label>
                  <textarea
                    name="descripcion"
                    placeholder="Descripción opcional del producto"
                    value={form.descripcion}
                    onChange={handleForm}
                    disabled={loading}
                    style={{
                      width: "100%", padding: "10px", borderRadius: 6,
                      border: "1px solid #fcebe6", marginTop: 4, background: "#fff"
                    }}
                    rows={3}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                      background: loading ? "#ccc" : "#80001c",
                      color: "#fff", border: "none", borderRadius: 6,
                      padding: "12px 24px", fontWeight: "bold", fontSize: "1rem",
                      cursor: loading ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? "Guardando..." : (editId ? "Actualizar Producto" : "Agregar Producto")}
                  </button>
                  <button 
                    type="button" 
                    onClick={cancelarEdicion}
                    disabled={loading}
                    style={{
                      background: "#fff", color: "#80001c",
                      border: "1px solid #80001c", borderRadius: 6,
                      padding: "12px 24px", fontWeight: "bold", fontSize: "1rem",
                      cursor: loading ? "not-allowed" : "pointer"
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Productos;