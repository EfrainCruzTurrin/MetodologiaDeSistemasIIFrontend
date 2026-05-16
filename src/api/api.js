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
  fetch(`${BASE}/api/productos`, { headers: authHeaders() }).then(r => r.json());

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
export const getCarrito = (clienteId) =>
  fetch(`${BASE}/api/carrito/${clienteId}`, { headers: authHeaders() }).then(r => r.json());

export const agregarProductoCarrito = (clienteId, data) =>
  fetch(`${BASE}/api/carrito/${clienteId}/productos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => r.json());

export const modificarCantidadCarrito = (clienteId, itemId, cantidad) =>
  fetch(`${BASE}/api/carrito/${clienteId}/items/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ cantidad }),
  }).then(r => r.json());

export const eliminarItemCarrito = (clienteId, itemId) =>
  fetch(`${BASE}/api/carrito/${clienteId}/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ── Pedidos ──
export const confirmarPedido = (data) =>
  fetch(`${BASE}/api/pedidos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
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
  fetch(`${BASE}/api/direcciones/${clienteId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getDireccionesEnvio = (clienteId) =>
  fetch(`${BASE}/api/direcciones/${clienteId}`, { headers: authHeaders() }).then(r => r.json());