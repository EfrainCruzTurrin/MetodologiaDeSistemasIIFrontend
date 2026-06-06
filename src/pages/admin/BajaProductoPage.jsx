import { useState, useEffect } from 'react';
import { getProductos, darDeBajaProducto } from '../../api/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';

export default function BajaProductoPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, nombre }
  const [bajaLoading, setBajaLoading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    getProductos()
      .then(data => setProductos(data.filter(p => p.activo !== false && p.estado !== 'INACTIVO')))
      .catch(() => setError('No se pudo cargar el listado de productos.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBaja = async () => {
    if (!confirm) return;
    setBajaLoading(true);
    try {
      await darDeBajaProducto(confirm.id);
      setProductos(prev => prev.filter(p => p.id !== confirm.id));
      showToast(`"${confirm.nombre}" fue dado de baja correctamente.`, 'success');
      setConfirm(null);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('kit') || msg.toLowerCase().includes('activo')) {
        showToast(`No se puede dar de baja: el producto está en un kit activo.`, 'error');
      } else if (msg.toLowerCase().includes('baja') || msg.toLowerCase().includes('inactivo')) {
        showToast(`Este producto ya estaba dado de baja.`, 'error');
      } else {
        showToast(msg || 'Error al dar de baja el producto.', 'error');
      }
      setConfirm(null);
    } finally {
      setBajaLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando productos..." />;

  return (
    <div className="page">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-trash" style={{ marginRight: 8, color: 'var(--danger)' }} />
            Dar de Baja Producto
          </h1>
          <p className="page-subtitle">Solo se muestran productos activos. La baja es permanente.</p>
        </div>
        <span className="badge badge-dim">{productos.length} activos</span>
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

      {productos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="ti ti-circle-check" style={{ color: 'var(--success)' }} />
            <p>No hay productos activos para dar de baja.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Stock</th>
                <th style={{ width: 120 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td style={{ color: 'var(--text-sec)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.descripcion || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    ${parseFloat(p.precio || 0).toFixed(2)}
                  </td>
                  <td>
                    <span style={{ color: p.stockActual === 0 ? 'var(--danger)' : p.stock <= 5 ? 'var(--warning)' : 'var(--success)' }}>
                      {p.stockActual ?? 0}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirm({ id: p.id, nombre: p.nombre })}
                    >
                      <i className="ti ti-trash" /> Dar de baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!confirm}
        title="¿Dar de baja este producto?"
        message={`Estás por dar de baja "${confirm?.nombre}". Esta acción no se puede deshacer y el producto dejará de estar disponible en el catálogo.`}
        confirmLabel="Dar de baja"
        confirmVariant="danger"
        onConfirm={handleBaja}
        onCancel={() => setConfirm(null)}
        loading={bajaLoading}
      />
    </div>
  );
}
