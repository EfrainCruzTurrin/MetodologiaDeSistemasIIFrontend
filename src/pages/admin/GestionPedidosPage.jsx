import { useState, useEffect } from 'react';
import { getPedidos, actualizarEstadoPedido } from '../../api/api';
import LoadingSpinner, { InlineSpinner } from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';

const ESTADO_CONFIG = {
  PENDIENTE:          { label: 'Pendiente',           badgeClass: 'badge-warning', icon: 'ti-clock' },
  LISTO_PARA_ENVIAR:  { label: 'Listo para enviar',   badgeClass: 'badge-info',    icon: 'ti-package-export' },
  CANCELADO:          { label: 'Cancelado',            badgeClass: 'badge-danger',  icon: 'ti-ban' },
  ENTREGADO:          { label: 'Entregado',            badgeClass: 'badge-success', icon: 'ti-circle-check' },
};

const TRANSICIONES = {
  PENDIENTE: ['LISTO_PARA_ENVIAR', 'CANCELADO'],
  LISTO_PARA_ENVIAR: [],
  CANCELADO: [],
  ENTREGADO: [],
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, badgeClass: 'badge-dim', icon: 'ti-help' };
  return (
    <span className={`badge ${cfg.badgeClass}`}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 10 }} /> {cfg.label}
    </span>
  );
}

function DetallePedidoModal({ pedido, onClose }) {
  if (!pedido) return null;
  return (
    <Modal
      isOpen={!!pedido}
      title={`Pedido #${pedido.id}`}
      onCancel={onClose}
      confirmLabel="Cerrar"
      confirmVariant="accent"
      onConfirm={onClose}
    >
      <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--text)' }}>Cliente:</strong> {pedido.clienteNombre || '—'}</span>
          <span><strong style={{ color: 'var(--text)' }}>Fecha:</strong> {pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-AR') : '—'}</span>
          <span><strong style={{ color: 'var(--text)' }}>Dirección:</strong> {pedido.direccionEnvio || '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--text)' }}>Medio de pago:</strong> {pedido.medioPago || '—'}</span>
          <span><strong style={{ color: 'var(--text)' }}>Estado:</strong> <EstadoBadge estado={pedido.estado} /></span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border2)' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px', color: 'var(--text-sec)', fontWeight: 600 }}>Producto</th>
            <th style={{ textAlign: 'center', padding: '6px 4px', color: 'var(--text-sec)', fontWeight: 600 }}>Cant.</th>
            <th style={{ textAlign: 'right', padding: '6px 4px', color: 'var(--text-sec)', fontWeight: 600 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items?.map((item, i) => (
            <tr key={item.id ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '7px 4px', color: 'var(--text)' }}>{item.productoNombre}</td>
              <td style={{ padding: '7px 4px', textAlign: 'center', color: 'var(--text-sec)' }}>x{item.cantidad}</td>
              <td style={{ padding: '7px 4px', textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>${parseFloat(item.subtotal || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>Total</td>
            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>${parseFloat(pedido.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </Modal>
  );
}

export default function GestionPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [transitioning, setTransitioning] = useState(null);
  const [detalle, setDetalle] = useState(null); // pedido seleccionado para ver detalle
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    getPedidos()
      .then(setPedidos)
      .catch(() => showToast('No se pudieron cargar los pedidos.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const solicitarTransicion = (pedidoId, nuevoEstado) => {
    if (nuevoEstado === 'CANCELADO') {
      setConfirm({ pedidoId, nuevoEstado, label: ESTADO_CONFIG[nuevoEstado]?.label });
    } else {
      ejecutarTransicion(pedidoId, nuevoEstado);
    }
  };

  const ejecutarTransicion = async (pedidoId, nuevoEstado) => {
    setTransitioning(pedidoId);
    try {
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
      showToast(`Pedido #${pedidoId} actualizado a "${ESTADO_CONFIG[nuevoEstado]?.label}".`, 'success');
    } catch (err) {
      showToast(err?.message || 'Error al actualizar el estado del pedido.', 'error');
    } finally {
      setTransitioning(null);
    }
  };

  const handleConfirmModal = async () => {
    if (!confirm) return;
    setConfirm(null);
    await ejecutarTransicion(confirm.pedidoId, confirm.nuevoEstado);
  };

  if (loading) return <LoadingSpinner message="Cargando pedidos..." />;

  return (
    <div className="page">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-clipboard-list" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Gestión de Pedidos
          </h1>
          <p className="page-subtitle">Gestioná los estados de los pedidos. El sistema notifica al cliente automáticamente.</p>
        </div>
        <span className="badge badge-accent">{pedidos.length} pedidos</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`badge ${cfg.badgeClass}`}>
            <i className={`ti ${cfg.icon}`} style={{ fontSize: 10 }} /> {cfg.label}
          </span>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="ti ti-clipboard-off" />
            <p>No hay pedidos registrados todavía.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => {
                const transiciones = TRANSICIONES[p.estado] || [];
                const isTransitioning = transitioning === p.id;
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700 }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {p.clienteNombre || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-sec)', fontSize: 12 }}>
                      {p.fecha ? new Date(p.fecha).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDetalle(p)}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        <i className="ti ti-eye" style={{ fontSize: 11 }} />
                        {p.items?.length ?? '—'} ítem(s)
                      </button>
                    </td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      ${parseFloat(p.total || 0).toFixed(2)}
                    </td>
                    <td>
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {transiciones.length === 0 ? (
                          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>
                        ) : (
                          transiciones.map(estado => (
                            <button
                              key={estado}
                              className={`btn btn-sm ${estado === 'CANCELADO' ? 'btn-danger' : 'btn-ghost'}`}
                              onClick={() => solicitarTransicion(p.id, estado)}
                              disabled={isTransitioning}
                              style={{ color: estado === 'LISTO_PARA_ENVIAR' ? 'var(--info)' : undefined, borderColor: estado === 'LISTO_PARA_ENVIAR' ? 'var(--info-border)' : undefined }}
                            >
                              {isTransitioning
                                ? <InlineSpinner size={12} />
                                : <i className={`ti ${ESTADO_CONFIG[estado]?.icon}`} />
                              }
                              {ESTADO_CONFIG[estado]?.label}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DetallePedidoModal pedido={detalle} onClose={() => setDetalle(null)} />

      <Modal
        isOpen={!!confirm}
        title="¿Cancelar este pedido?"
        message={`Al cancelar el pedido #${confirm?.pedidoId}, el stock de los productos será repuesto automáticamente y el cliente recibirá un email de notificación. Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar pedido"
        confirmVariant="danger"
        onConfirm={handleConfirmModal}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}