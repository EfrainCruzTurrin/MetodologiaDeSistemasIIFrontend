import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, agregarProductoCarrito } from '../../api/api';
import { useCliente } from '../../context/ClienteContext';

const MARCAS_COLORES = [
  '#c8f55a', '#5ab4f5', '#f5c842', '#5af596', '#f55a5a',
  '#c45af5', '#f5915a', '#5af5e8',
];

function badgeColor(marca) {
  if (!marca) return MARCAS_COLORES[0];
  let hash = 0;
  for (let i = 0; i < marca.length; i++) hash = marca.charCodeAt(i) + ((hash << 5) - hash);
  return MARCAS_COLORES[Math.abs(hash) % MARCAS_COLORES.length];
}

function StockBadge({ stock, minimo }) {
  if (stock === 0)
    return <span style={styles.badgeOut}>Sin stock</span>;
  if (stock <= minimo)
    return <span style={styles.badgeLow}>Stock bajo</span>;
  return <span style={styles.badgeOk}>Disponible</span>;
}

function ProductoCard({ producto, onAgregar }) {
  const [agregado, setAgregado] = useState(false);
  const color = badgeColor(producto.marca);

  function handleAgregar() {
    onAgregar(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardAccent, background: color }} />
      <div style={styles.cardBody}>
        <div style={styles.cardHeader}>
          <span style={{ ...styles.marcaBadge, color, borderColor: color + '55', background: color + '18' }}>
            {producto.marca || 'Sin marca'}
          </span>
          <StockBadge stock={producto.stockActual} minimo={producto.stockMinimo} />
        </div>
        <h3 style={styles.cardTitle}>{producto.nombre}</h3>
        <p style={styles.cardPrice}>${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        <div style={styles.cardFooter}>
          <span style={styles.stockInfo}>
            <i className="ti ti-package" style={{ fontSize: 14, marginRight: 4 }} aria-hidden="true" />
            {producto.stockActual} unid.
          </span>
          <button
            style={agregado ? styles.btnAgregado : (producto.stockActual === 0 ? styles.btnDisabled : styles.btnAgregar)}
            onClick={handleAgregar}
            disabled={producto.stockActual === 0 || agregado}
          >
            {agregado
              ? <><i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden="true" /> Agregado</>
              : <><i className="ti ti-shopping-cart-plus" style={{ fontSize: 14 }} aria-hidden="true" /> Agregar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const { nombre, carritoId } = useCliente();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState('');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    setCargando(true);
    getProductos()
      .then(data => {
        setProductos(data);
        setFiltrados(data);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudieron cargar los productos. Intentá de nuevo más tarde.');
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    let lista = [...productos];
    if (busqueda.trim())
      lista = lista.filter(p =>
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca?.toLowerCase().includes(busqueda.toLowerCase())
      );
    if (marcaFiltro)
      lista = lista.filter(p => p.marca === marcaFiltro);
    if (soloDisponibles)
      lista = lista.filter(p => p.stockActual > 0);
    if (ordenPrecio === 'asc')
      lista.sort((a, b) => a.precio - b.precio);
    else if (ordenPrecio === 'desc')
      lista.sort((a, b) => b.precio - a.precio);
    setFiltrados(lista);
  }, [busqueda, marcaFiltro, soloDisponibles, ordenPrecio, productos]);

  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))];

  async function handleAgregar(producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });
    try {
      await agregarProductoCarrito(carritoId, { productoId: producto.id, cantidad: 1 });
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
    }
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.pageTitle}>Catálogo</h1>
          <p style={styles.pageSubtitle}>
            {cargando ? 'Cargando productos…'
              : `${filtrados.length} producto${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          style={styles.carritoBtn}
          onClick={() => navigate('/carrito')}
          aria-label={`Ver carrito, ${totalCarrito} items`}
        >
          <i className="ti ti-shopping-cart" style={{ fontSize: 18 }} aria-hidden="true" />
          {totalCarrito > 0 && <span style={styles.carritoCount}>{totalCarrito}</span>}
          <span style={{ marginLeft: 6 }}>Carrito</span>
        </button>
      </div>

      <div style={styles.filtros}>
        <div style={styles.searchWrap}>
          <i className="ti ti-search" style={styles.searchIcon} aria-hidden="true" />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre o marca…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar productos"
          />
          {busqueda && (
            <button style={styles.clearBtn} onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
              <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          )}
        </div>

        <select
          style={styles.select}
          value={marcaFiltro}
          onChange={e => setMarcaFiltro(e.target.value)}
          aria-label="Filtrar por marca"
        >
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          style={styles.select}
          value={ordenPrecio}
          onChange={e => setOrdenPrecio(e.target.value)}
          aria-label="Ordenar por precio"
        >
          <option value="">Precio: sin orden</option>
          <option value="asc">Precio: menor a mayor</option>
          <option value="desc">Precio: mayor a menor</option>
        </select>

        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={e => setSoloDisponibles(e.target.checked)}
            style={{ accentColor: '#c8f55a', width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ marginLeft: 8, fontSize: 14 }}>Solo disponibles</span>
        </label>
      </div>

      {cargando && (
        <div style={styles.estadoWrap}>
          <div style={styles.spinner} aria-label="Cargando" />
          <p style={styles.estadoTexto}>Cargando productos…</p>
        </div>
      )}

      {!cargando && error && (
        <div style={styles.errorBox}>
          <i className="ti ti-alert-circle" style={{ fontSize: 20, marginRight: 10 }} aria-hidden="true" />
          {error}
        </div>
      )}

      {!cargando && !error && filtrados.length === 0 && (
        <div style={styles.estadoWrap}>
          <i className="ti ti-mood-sad" style={{ fontSize: 40, color: '#555', marginBottom: 12 }} aria-hidden="true" />
          <p style={styles.estadoTexto}>No se encontraron productos.</p>
          <button style={styles.resetBtn} onClick={() => { setBusqueda(''); setMarcaFiltro(''); setSoloDisponibles(false); setOrdenPrecio(''); }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {!cargando && !error && filtrados.length > 0 && (
        <div style={styles.grid}>
          {filtrados.map(p => (
            <ProductoCard key={p.id} producto={p} onAgregar={handleAgregar} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f11',
    color: '#e8e8e8',
    fontFamily: 'sans-serif',
    padding: '0 0 4rem',
  },
  topBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '2rem 2rem 0',
    gap: 16,
    flexWrap: 'wrap',
  },
  pageTitle: {
    margin: '0 0 4px',
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    margin: 0,
    fontSize: 14,
    color: '#888',
  },
  carritoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '10px 18px',
    background: '#c8f55a',
    color: '#0f0f11',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    position: 'relative',
    letterSpacing: '0.3px',
  },
  carritoCount: {
    background: '#0f0f11',
    color: '#c8f55a',
    borderRadius: '50%',
    width: 20,
    height: 20,
    fontSize: 11,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  filtros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '1.5rem 2rem',
    alignItems: 'center',
    borderBottom: '1px solid #222',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 220px',
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 16,
    color: '#666',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 36px 9px 36px',
    background: '#18181c',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#e8e8e8',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '9px 12px',
    background: '#18181c',
    border: '1px solid #2a2a2e',
    borderRadius: 8,
    color: '#e8e8e8',
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
    flex: '0 1 auto',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#bbb',
    userSelect: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 20,
    padding: '2rem',
  },
  card: {
    background: '#18181c',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #2a2a2e',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.2s, transform 0.15s',
  },
  cardAccent: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: '1rem 1.1rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  marcaBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid',
  },
  badgeOk: {
    fontSize: 11,
    background: '#1a2e1a',
    color: '#5af596',
    padding: '3px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  badgeLow: {
    fontSize: 11,
    background: '#2e2a14',
    color: '#f5c842',
    padding: '3px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  badgeOut: {
    fontSize: 11,
    background: '#2e1a1a',
    color: '#f55a5a',
    padding: '3px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  cardTitle: {
    margin: '4px 0 0',
    fontSize: 15,
    fontWeight: 600,
    color: '#f0f0f0',
    lineHeight: 1.35,
  },
  cardPrice: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 10,
    borderTop: '1px solid #222',
    gap: 8,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
    display: 'flex',
    alignItems: 'center',
  },
  btnAgregar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    background: '#c8f55a',
    color: '#0f0f11',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnAgregado: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    background: '#1a2e1a',
    color: '#5af596',
    border: '1px solid #2a4a2a',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'default',
  },
  btnDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    background: '#1a1a1a',
    color: '#444',
    border: '1px solid #222',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'not-allowed',
  },
  estadoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5rem 2rem',
    gap: 12,
  },
  estadoTexto: {
    color: '#666',
    fontSize: 15,
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem',
    padding: '1rem 1.25rem',
    background: '#2e1a1a',
    border: '1px solid #4a2a2a',
    borderRadius: 8,
    color: '#f55a5a',
    fontSize: 14,
  },
  resetBtn: {
    marginTop: 8,
    padding: '8px 20px',
    background: 'transparent',
    border: '1px solid #444',
    borderRadius: 6,
    color: '#bbb',
    fontSize: 13,
    cursor: 'pointer',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #2a2a2e',
    borderTopColor: '#c8f55a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);