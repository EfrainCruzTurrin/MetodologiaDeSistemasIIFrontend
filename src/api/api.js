export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const authHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

// ── Auth ──
export const login = (email, password) =>
  fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Productos ──
export const getProductos = () =>
  fetch(`${BASE_URL}/api/productos`, {
    headers: authHeaders(),
  }).then(r => r.json());

export const crearProducto = (data) =>
  fetch(`${BASE_URL}/api/productos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const darDeBajaProducto = (id) =>
  fetch(`${BASE_URL}/api/productos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const importarImagenProducto = (id, formData) =>
  fetch(`${BASE_URL}/api/productos/${id}/imagen`, {
    method: 'POST',
    headers: authHeaders(true),
    body: formData,
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });


export const actualizarStockProducto = (id, stockActual) =>
  fetch(`${BASE_URL}/api/productos/${id}/stock`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ stockActual }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Clientes ──
export const registrarCliente = (data) =>
  fetch(`${BASE_URL}/api/clientes/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getCliente = (id) =>
  fetch(`${BASE_URL}/api/clientes/${id}`, { headers: authHeaders() }).then(r => r.json());

export const getClientes = () =>
  fetch(`${BASE_URL}/api/clientes`, { headers: authHeaders() }).then(r => r.json());

export const buscarClientesPorNombre = (nombre) =>
  fetch(`${BASE_URL}/api/clientes/buscar?nombre=${encodeURIComponent(nombre)}`, {
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Carrito ──
export const agregarProductoCarrito = (carritoId, data) =>
  fetch(`${BASE_URL}/api/carrito/${carritoId}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) throw new Error('Error al agregar');
  });

export const modificarCantidadCarrito = (carritoId, itemId, cantidad) =>
  fetch(`${BASE_URL}/api/carrito/items/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ cantidad }),
  }).then(r => {
    if (!r.ok) throw new Error('Stock insuficiente');
    return { cantidad };
  });

export const eliminarItemCarrito = (carritoId, itemId) =>
  fetch(`${BASE_URL}/api/carrito/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

export const getCarrito = (carritoId) =>
  fetch(`${BASE_URL}/api/carrito/${carritoId}`, { headers: authHeaders() }).then(r => r.json());

export const addKitToCarrito = async (carritoId, kitId, cantidad = 1) => {
  // 1. Usamos BASE_URL
  const response = await fetch(`${BASE_URL}/api/carrito/${carritoId}/kits`, {
    method: 'POST',
    // 2. Reemplazamos los headers fijos por authHeaders() 👇
    headers: authHeaders(), 
    body: JSON.stringify({ kitId, cantidad }),
  });

  if (!response.ok) {
    // Esto te ayudará a ver en la consola el error real que devuelve el backend (ej: "Stock insuficiente")
    const error = await response.text();
    throw new Error(error || 'Error al agregar el kit al carrito');
  }
};

// ── Pedidos ──
export const confirmarPedido = (data) =>
  fetch(`${BASE_URL}/api/pedidos`, {
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
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === 'number' ? parsed : (parsed?.id || parsed?.pedidoId || parsed);
    } catch {
      return Number(text);
    }
  });

export const aplicarCupon = (pedidoId, clienteId, codigoCupon) =>
  fetch(`${BASE_URL}/api/pedidos/${pedidoId}/aplicar-cupon`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ clienteId: Number(clienteId), codigoCupon }),
  }).then(async r => {
    if (!r.ok) {
      const text = await r.text();
      let msg;
      try { msg = JSON.parse(text)?.error || text; } catch { msg = text; }
      return Promise.reject(new Error(msg));
    }
    return r.json();
  });

export const actualizarEstadoPedido = (pedidoId, estado) =>
  fetch(`${BASE_URL}/api/pedidos/${pedidoId}/estado`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ nuevoEstado: estado }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return {};
  });

export const getReporteProductosMasVendidos = (mes, anio) =>
  fetch(`${BASE_URL}/api/pedidos/reporte?mes=${mes}&anio=${anio}`, {
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getPedidos = () =>
  fetch(`${BASE_URL}/api/pedidos`, { headers: authHeaders() }).then(r => r.json());

// ── Kits ──
export const crearKit = (data) =>
  fetch(`${BASE_URL}/api/kits`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getKits = () =>
  fetch(`${BASE_URL}/api/kits`, { headers: authHeaders() }).then(r => r.json());

export const deleteKit = async (id) => {
  // Configurado correctamente con BASE_URL 👇
  const response = await fetch(`${BASE_URL}/api/kits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(), // Recomiendo agregar headers si tu backend pide token para borrar
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error al eliminar el kit');
  }
};

// ── Direcciones de envío ──
export const registrarDireccionEnvio = (clienteId, data) =>
  fetch(`${BASE_URL}/api/clientes/${clienteId}/direcciones-envio`, {
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
  fetch(`${BASE_URL}/api/clientes/${clienteId}/direcciones-envio`, {
    headers: authHeaders(),
  }).then(r => r.json());

// ── Reporte Stock Mínimo ──
export const obtenerReporteStock = (porcentaje) =>
  fetch(`${BASE_URL}/api/reportes/stock-minimo?porcentaje=${porcentaje}`, {
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

// ── Cupones ──
export const crearCuponMonto = (data, vendedorId) =>
  fetch(`${BASE_URL}/api/cupones/monto`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Usuario-Id': String(vendedorId) },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const crearCuponPorcentaje = (data, vendedorId) =>
  fetch(`${BASE_URL}/api/cupones/porcentaje`, {
    method: 'POST',
    headers: { ...authHeaders(), 'X-Usuario-Id': String(vendedorId) },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getCuponesPorVendedor = (vendedorId) =>
  fetch(`${BASE_URL}/api/cupones/vendedor/${vendedorId}`, {
    headers: authHeaders(),
  }).then(r => r.json());

export const asignarClientesCupon = (cuponId, clienteIds) =>
  fetch(`${BASE_URL}/api/cupones/${cuponId}/asignar-clientes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ clienteIds }),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const getMisCupones = (clienteId) =>
  fetch(`${BASE_URL}/api/cupones/cliente/${clienteId}`, {
    headers: authHeaders(),
  }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e));
    return r.json();
  });

export const validarCupon = (codigo) =>
  fetch(`${BASE_URL}/api/cupones/validar/${codigo}`, { headers: authHeaders() })
    .then(r => r.json());

export const getCuponPorCodigo = (codigo) =>
  fetch(`${BASE_URL}/api/cupones/codigo/${codigo}`, { headers: authHeaders() })
    .then(r => {
      if (!r.ok) throw new Error('Cupón no encontrado');
      return r.json();
    });