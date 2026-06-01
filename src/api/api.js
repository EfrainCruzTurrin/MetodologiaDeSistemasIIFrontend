const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const authHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

// ── Auth ──
export const login = (email, password) =>
  fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Productos ──
export const getProductos = () =>
  fetch(`${BASE}/api/productos`, {
    headers: authHeaders(),
  }).then(r => r.json());

export const crearProducto = (data) =>
  fetch(`${BASE}/api/productos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const darDeBajaProducto = (id) =>
  fetch(`${BASE}/api/productos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const importarImagenProducto = (id, formData) =>
  fetch(`${BASE}/api/productos/${id}/imagen`, {
    method: 'POST',
    headers: authHeaders(true),
    body: formData,
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Clientes ──
export const registrarCliente = (data) =>
  fetch(`${BASE}/api/clientes/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getCliente = (id) =>
  fetch(`${BASE}/api/clientes/${id}`, { headers: authHeaders() }).then(r => r.json());

// ── Carrito ──
export const agregarProductoCarrito = (carritoId, data) =>
  fetch(`${BASE}/api/carrito/${carritoId}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) throw new Error('Error al agregar');
  });

export const modificarCantidadCarrito = (carritoId, itemId, cantidad) =>
  fetch(`${BASE}/api/carrito/items/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ cantidad }),
  }).then(r => {
    if (!r.ok) throw new Error('Stock insuficiente');
    return { cantidad };
  });

export const eliminarItemCarrito = (carritoId, itemId) =>
  fetch(`${BASE}/api/carrito/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

export const getCarrito = (carritoId) =>
  fetch(`${BASE}/api/carrito/${carritoId}`, { headers: authHeaders() }).then(r => r.json());

// ── Pedidos ──
export const confirmarPedido = (data) =>
  fetch(`${BASE}/api/pedidos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      carritoId: data.carritoId,
      direccionEnvioId: parseInt(data.direccionEnvio?.id, 10),
      medioPago: data.medioPago,
    }),
  }).then(async r => {
    if (!r.ok) {
      const text = await r.text();
      let msg;
      try { msg = JSON.parse(text)?.message || text; } catch { msg = text; }
      return Promise.reject(new Error(msg));
    }
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { mensaje: text }; }
  });

export const actualizarEstadoPedido = (pedidoId, estado) =>
  fetch(`${BASE}/api/pedidos/${pedidoId}/estado`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ estado }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

  export const getReporteProductosMasVendidos = (mes, anio) =>
  fetch(
    `${BASE}/api/pedidos/reporte?mes=${mes}&anio=${anio}`,
    {
      headers: authHeaders()
    }
  ).then(r => {
    if (!r.ok) {
      return r.json().then(e => Promise.reject(e));
    }
    return r.json();
  });

export const getPedidos = () =>
  fetch(`${BASE}/api/pedidos`, { headers: authHeaders() }).then(r => r.json());

// ── Kits ──
export const crearKit = (data) =>
  fetch(`${BASE}/api/kits`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getKits = () =>
  fetch(`${BASE}/api/kits`, { headers: authHeaders() }).then(r => r.json());

// ── Direcciones de envío ──
export const registrarDireccionEnvio = (clienteId, data) =>
  fetch(`${BASE}/api/clientes/${clienteId}/direcciones-envio`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      pais: data.pais,
      provincia: data.provincia,
      localidad: data.localidad,
      calle: data.calle,
      numeroCalle: parseInt(data.numero, 10),
      pisoDepto: [data.piso, data.departamento].filter(Boolean).join(' ') || null,
    }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getDireccionesEnvio = (clienteId) =>
  fetch(`${BASE}/api/clientes/${clienteId}/direcciones-envio`, {
    headers: authHeaders(),
  }).then(r => r.json());