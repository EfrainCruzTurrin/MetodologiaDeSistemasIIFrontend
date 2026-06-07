import { useState, useEffect, useMemo } from 'react';
import { getProductos, actualizarStockProducto } from '../../api/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

function StockBadge({ stock }) {
  if (stock === 0)
    return <span className="badge badge-danger">Sin stock</span>;
  if (stock <= 5)
    return <span className="badge badge-warning">Stock bajo ({stock})</span>;
  return <span className="badge badge-success">{stock} un.</span>;
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <i className="ti ti-selector" style={{ fontSize: 11, opacity: 0.3 }} />;
  return sortDir === 'asc'
    ? <i className="ti ti-sort-ascending" style={{ fontSize: 11, color: 'var(--accent)' }} />
    : <i className="ti ti-sort-descending" style={{ fontSize: 11, color: 'var(--accent)' }} />;
}

// ── Modal edición de stock ────────────────────────────────────────────────────
function EditStockModal({ producto, onClose, onSave }) {
  const [valor, setValor] = useState(producto.stockActual ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const num = parseInt(valor, 10);
    if (isNaN(num) || num < 0) { setError('Ingresá un número válido (≥ 0).'); return; }
    setSaving(true);
    try {
      const updated = await actualizarStockProducto(producto.id, num);
      onSave(updated);
    } catch (e) {
      setError(e?.message || 'Error al actualizar el stock.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Modificar stock</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-sec)', fontSize: 13 }}>
          {producto.nombre}
        </p>

        <div className="field">
          <label>Stock actual</label>
          <input
            type="number"
            min="0"
            value={valor}
            onChange={e => { setValor(e.target.value); setError(null); }}
            autoFocus
          />
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 12px' }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 4 }} />{error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // producto seleccionado para editar stock

  const [filters, setFilters] = useState({
    nombre: '', descripcion: '', precioMin: '', precioMax: '', stockMin: '',
  });
  const [sortCol, setSortCol] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    getProductos()
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el listado de productos.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Cuando el modal guarda, reemplazamos el producto en el array local (sin refetch)
  const handleStockSaved = (updatedProducto) => {
    setProductos(prev => prev.map(p => p.id === updatedProducto.id ? updatedProducto : p));
    setEditando(null);
  };

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const desc = (p.descripcion || '').toLowerCase();
      if (filters.nombre && !nombre.includes(filters.nombre.toLowerCase())) return false;
      if (filters.descripcion && !desc.includes(filters.descripcion.toLowerCase())) return false;
      if (filters.precioMin !== '' && p.precio < parseFloat(filters.precioMin)) return false;
      if (filters.precioMax !== '' && p.precio > parseFloat(filters.precioMax)) return false;
      if (filters.stockMin !== '' && p.stockActual < parseInt(filters.stockMin)) return false;
      return true;
    });
  }, [productos, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const field = sortCol === 'stock' ? 'stockActual' : sortCol;
      let va = a[field], vb = b[field];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const stats = useMemo(() => {
    const sinStock = productos.filter(p => p.stockActual === 0).length;
    const stockBajo = productos.filter(p => p.stockActual > 0 && p.stockActual <= 5).length;
    const total = productos.length;
    const promedio = total > 0
      ? (productos.reduce((sum, p) => sum + (p.precio || 0), 0) / total).toFixed(2)
      : '0.00';
    return { total, sinStock, stockBajo, promedio };
  }, [productos]);

  if (loading) return <LoadingSpinner message="Cargando productos..." />;

  return (
    <div className="page">
      {editando && (
        <EditStockModal
          producto={editando}
          onClose={() => setEditando(null)}
          onSave={handleStockSaved}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-package" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Productos
          </h1>
          <p className="page-subtitle">Listado completo de insumos de pintura corporal</p>
        </div>
        <span className="badge badge-accent" style={{ fontSize: 14, padding: '5px 12px' }}>
          {sorted.length} / {productos.length}
        </span>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
          color: 'var(--danger)', fontSize: 13,
        }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      }}>
        <div className="field" style={{ flex: '1 1 150px' }}>
          <label>Nombre</label>
          <input value={filters.nombre} onChange={e => setFilter('nombre', e.target.value)} placeholder="Buscar..." />
        </div>
        <div className="field" style={{ flex: '1 1 150px' }}>
          <label>Descripción</label>
          <input value={filters.descripcion} onChange={e => setFilter('descripcion', e.target.value)} placeholder="Buscar..." />
        </div>
        <div className="field" style={{ flex: '0 0 100px' }}>
          <label>Precio mín</label>
          <input type="number" min="0" value={filters.precioMin} onChange={e => setFilter('precioMin', e.target.value)} placeholder="$0" />
        </div>
        <div className="field" style={{ flex: '0 0 100px' }}>
          <label>Precio máx</label>
          <input type="number" min="0" value={filters.precioMax} onChange={e => setFilter('precioMax', e.target.value)} placeholder="$∞" />
        </div>
        <div className="field" style={{ flex: '0 0 100px' }}>
          <label>Stock mín</label>
          <input type="number" min="0" value={filters.stockMin} onChange={e => setFilter('stockMin', e.target.value)} placeholder="0" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ nombre: '', descripcion: '', precioMin: '', precioMax: '', stockMin: '' })}
          >
            <i className="ti ti-x" /> Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="ti ti-package-off" />
            <p>No se encontraron productos con los filtros aplicados.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  { key: 'nombre',      label: 'Nombre' },
                  { key: 'descripcion', label: 'Descripción' },
                  { key: 'precio',      label: 'Precio' },
                  { key: 'stock',       label: 'Stock' },
                ].map(col => (
                  <th key={col.key} className="sortable" onClick={() => handleSort(col.key)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {col.label}
                      <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
                <th style={{ width: 60 }} /> {/* columna acciones */}
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td style={{ color: 'var(--text-sec)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.descripcion || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    ${parseFloat(p.precio || 0).toFixed(2)}
                  </td>
                  <td><StockBadge stock={p.stockActual ?? 0} /></td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Modificar stock"
                      onClick={() => setEditando(p)}
                      style={{ padding: '4px 8px' }}
                    >
                      <i className="ti ti-pencil" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats footer */}
      <div className="stats-bar" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="stat-label">Total mostrado</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>{sorted.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sin stock</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.sinStock}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Stock bajo</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.stockBajo}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Precio promedio</div>
          <div className="stat-value" style={{ color: 'var(--accent)', fontSize: 18 }}>${stats.promedio}</div>
        </div>
      </div>
    </div>
  );
}