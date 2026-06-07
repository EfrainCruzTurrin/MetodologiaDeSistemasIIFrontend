import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCarrito, modificarCantidadCarrito, eliminarItemCarrito } from '../../api/api';
import { useCliente } from '../../context/ClienteContext';
import LoadingSpinner, { InlineSpinner } from '../../components/shared/LoadingSpinner';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';

function CartItem({ item, clienteId, onUpdate, onRemove }) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleCantidad = async (delta) => {
    const nuevaCantidad = (item.cantidad || 1) + delta;
    if (nuevaCantidad < 1) return;
    setUpdating(true);
    setLocalError(null);
    try {
      const updated = await modificarCantidadCarrito(clienteId, item.id, nuevaCantidad);
      onUpdate(item.id, updated?.cantidad ?? nuevaCantidad);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('stock')) {
        setLocalError('No hay suficiente stock disponible.');
      } else {
        setLocalError('Error al actualizar la cantidad.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await eliminarItemCarrito(clienteId, item.id);
      onRemove(item.id);
    } catch {
      setLocalError('No se pudo eliminar el item.');
    } finally {
      setRemoving(false);
    }
  };

  const precio = parseFloat(item.precio || item.precioUnitario || 0);
  const cantidad = item.cantidad || 1;
  const subtotal = precio * cantidad;

  // Error 4 — distinguir si el item es un kit o un producto suelto
  const esKit = Boolean(item.kitId);
  const nombre = esKit
    ? (item.kitNombre || item.nombre || '—')
    : (item.nombre || item.productoNombre || item.producto?.nombre || '—');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      background: localError ? 'var(--danger-dim)' : 'transparent',
      transition: 'background 0.2s',
    }}>
      {/* Image / Kit icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 8, flexShrink: 0,
        background: esKit ? 'var(--accent-dim)' : 'var(--surface2)',
        border: `1px solid ${esKit ? 'var(--accent-border)' : 'var(--border2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {!esKit && item.imagenUrl ? (
          <img src={item.imagenUrl} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <i
            className={esKit ? 'ti ti-box-multiple' : 'ti ti-package'}
            style={{ color: esKit ? 'var(--accent)' : 'var(--text-dim)', fontSize: 20 }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {/* Badge KIT solo para items de kit */}
          {esKit && (
            <span className="badge badge-accent" style={{ fontSize: 10, padding: '2px 6px' }}>KIT</span>
          )}
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombre}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
          ${precio.toFixed(2)} c/u
        </div>
        {localError && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{localError}</div>}
      </div>

      {/* Qty controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => handleCantidad(-1)}
          disabled={updating || cantidad <= 1}
          style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
        >
          <i className="ti ti-minus" />
        </button>
        <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
          {updating ? <InlineSpinner size={12} /> : cantidad}
        </span>
        <button
          onClick={() => handleCantidad(1)}
          disabled={updating}
          style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
        >
          <i className="ti ti-plus" />
        </button>
      </div>

      {/* Subtotal */}
      <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
        ${subtotal.toFixed(2)}
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={removing}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}
      >
        {removing ? <InlineSpinner size={13} /> : <i className="ti ti-trash" />}
      </button>
    </div>
  );
}

export default function CarritoPage() {
  const { clienteId } = useCliente();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    getCarrito(clienteId)
      .then(data => setItems(data?.items || data || []))
      .catch(() => showToast('No se pudo cargar el carrito.', 'error'))
      .finally(() => setLoading(false));
  }, [clienteId]);

  const handleUpdate = (itemId, newCantidad) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, cantidad: newCantidad } : i));
  };

  const handleRemove = (itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const total = items.reduce((sum, i) => {
    const precio = parseFloat(i.precio || i.precioUnitario || 0);
    return sum + precio * (i.cantidad || 1);
  }, 0);

  const cantidadKits = items.filter(i => i.kitId).length;
  const cantidadProductos = items.filter(i => !i.kitId).length;

  const subtitleText = () => {
    if (items.length === 0) return 'Tu carrito';
    const partes = [];
    if (cantidadProductos > 0) partes.push(`${cantidadProductos} producto(s)`);
    if (cantidadKits > 0) partes.push(`${cantidadKits} kit(s)`);
    return partes.join(' · ');
  };

  if (loading) return <LoadingSpinner message="Cargando carrito..." />;

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-shopping-cart" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Mi carrito
          </h1>
          <p className="page-subtitle">{subtitleText()}</p>
        </div>
        {items.length > 0 && (
          <span className="badge badge-accent">{items.length} ítem(s)</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="ti ti-shopping-cart-off" />
            <p>Tu carrito está vacío.</p>
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/admin/productos')}>
              <i className="ti ti-arrow-left" /> Ver catálogo
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                clienteId={clienteId}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Total + confirm */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Total</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>${total.toFixed(2)}</div>
            </div>
            <button
              className="btn btn-accent"
              style={{ padding: '11px 24px', fontSize: 14 }}
              onClick={() => navigate('/confirmar-pedido')}
            >
              <i className="ti ti-check" /> Confirmar pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}