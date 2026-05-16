import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCarrito, getCliente, getDireccionesEnvio, confirmarPedido } from '../../api/api';
import { useCliente } from '../../context/ClienteContext';
import LoadingSpinner, { InlineSpinner } from '../../components/shared/LoadingSpinner';

const CBU = '0000003100064448765019';
const ALIAS = 'bodypaint.pagos';

function validate(form, items) {
  const errors = {};
  if (items.length === 0) errors.general = 'El carrito está vacío.';
  if (!form.medioPago) errors.medioPago = 'Seleccioná un medio de pago.';
  if (!form.direccionId && !form.nuevaDireccion?.calle) errors.direccion = 'Indicá una dirección de envío.';
  if (form.medioPago === 'TARJETA') {
    if (!form.tarjetaNumero?.trim()) errors.tarjetaNumero = 'Número requerido.';
    if (!form.tarjetaNombre?.trim()) errors.tarjetaNombre = 'Nombre requerido.';
    if (!form.tarjetaVenc?.trim()) errors.tarjetaVenc = 'Vencimiento requerido.';
    if (!form.tarjetaCVV?.trim()) errors.tarjetaCVV = 'CVV requerido.';
  }
  return errors;
}

export default function ConfirmarPedidoPage() {
  const { clienteId } = useCliente();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    medioPago: '',
    direccionId: '',
    usarNuevaDireccion: false,
    nuevaDireccion: { calle: '', numero: '' },
    tarjetaNumero: '',
    tarjetaNombre: '',
    tarjetaVenc: '',
    tarjetaCVV: '',
  });

  useEffect(() => {
    Promise.all([
      getCarrito(clienteId),
      getDireccionesEnvio(clienteId).catch(() => []),
    ]).then(([carrito, dirs]) => {
      const itemsData = carrito?.items || carrito || [];
      setItems(itemsData);
      setDirecciones(Array.isArray(dirs) ? dirs : []);
      if (dirs?.length > 0) setForm(f => ({ ...f, direccionId: String(dirs[0].id) }));
    }).catch(() => setServerError('Error al cargar los datos del pedido.'))
      .finally(() => setLoading(false));
  }, [clienteId]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined, general: undefined }));
  };

  const total = items.reduce((sum, i) => {
    const precio = parseFloat(i.precio || i.precioUnitario || 0);
    return sum + precio * (i.cantidad || 1);
  }, 0);

  const handleSubmit = async () => {
    setServerError(null);
    const errs = validate(form, items);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    const payload = {
      clienteId,
      items: items.map(i => ({ productoId: i.productoId || i.id, cantidad: i.cantidad })),
      medioPago: form.medioPago,
      direccionEnvio: form.usarNuevaDireccion
        ? form.nuevaDireccion
        : { id: form.direccionId },
      datosPago: form.medioPago === 'TARJETA' ? {
        numero: form.tarjetaNumero,
        nombre: form.tarjetaNombre,
        vencimiento: form.tarjetaVenc,
        cvv: form.tarjetaCVV,
      } : undefined,
    };

    try {
      const result = await confirmarPedido(payload);
      setSuccess(result?.id || result?.pedidoId || '—');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('stock')) {
        setServerError('No hay suficiente stock para uno o más productos del carrito.');
      } else {
        setServerError(msg || 'Error al confirmar el pedido. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando pedido..." />;

  if (success) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-dim)', border: '2px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="ti ti-circle-check" style={{ color: 'var(--success)', fontSize: 24 }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>¡Pedido confirmado!</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 12 }}>Tu pedido fue registrado exitosamente.</p>
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Número de pedido</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>#{success}</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-sec)' }}>Recibirás un email de confirmación con los detalles de tu compra.</p>
          <button className="btn btn-ghost" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/carrito')}>
            <i className="ti ti-arrow-left" /> Volver al carrito
          </button>
        </div>
      </div>
    );
  }

  const sectionTitle = (label) => (
    <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>{label}</h3>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-check" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Confirmar pedido
          </h1>
        </div>
      </div>

      {serverError && (
        <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, color: 'var(--danger)', fontSize: 13 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{serverError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dirección */}
          <div className="card">
            {sectionTitle('Dirección de envío')}
            {errors.direccion && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{errors.direccion}</div>}

            {direcciones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {direcciones.map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', border: `1px solid ${form.direccionId === String(d.id) && !form.usarNuevaDireccion ? 'var(--accent-border)' : 'var(--border2)'}`, borderRadius: 'var(--radius)', background: form.direccionId === String(d.id) && !form.usarNuevaDireccion ? 'var(--accent-dim)' : 'transparent' }}>
                    <input type="radio" name="direccion" checked={form.direccionId === String(d.id) && !form.usarNuevaDireccion} onChange={() => { setField('direccionId', String(d.id)); setField('usarNuevaDireccion', false); }} style={{ marginTop: 2 }} />
                    <div style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{d.calle} {d.numero}</div>
                      <div style={{ color: 'var(--text-sec)', fontSize: 12 }}>{d.localidad}, {d.provincia}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginBottom: form.usarNuevaDireccion ? 12 : 0 }}>
              <input type="radio" name="direccion" checked={form.usarNuevaDireccion} onChange={() => { setField('usarNuevaDireccion', true); setField('direccionId', ''); }} />
              Nueva dirección
            </label>

            {form.usarNuevaDireccion && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginTop: 8 }}>
                <div className="field">
                  <label>Calle *</label>
                  <input value={form.nuevaDireccion.calle} onChange={e => setField('nuevaDireccion', { ...form.nuevaDireccion, calle: e.target.value })} placeholder="Av. Corrientes" />
                </div>
                <div className="field">
                  <label>Número *</label>
                  <input value={form.nuevaDireccion.numero} onChange={e => setField('nuevaDireccion', { ...form.nuevaDireccion, numero: e.target.value })} placeholder="1234" />
                </div>
              </div>
            )}
          </div>

          {/* Medio de pago */}
          <div className="card">
            {sectionTitle('Medio de pago')}
            {errors.medioPago && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{errors.medioPago}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { value: 'EFECTIVO', label: 'Efectivo contra entrega', icon: 'ti-cash' },
                { value: 'TRANSFERENCIA', label: 'Transferencia bancaria', icon: 'ti-building-bank' },
                { value: 'TARJETA', label: 'Tarjeta de crédito/débito', icon: 'ti-credit-card' },
              ].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', border: `1px solid ${form.medioPago === opt.value ? 'var(--accent-border)' : 'var(--border2)'}`, borderRadius: 'var(--radius)', background: form.medioPago === opt.value ? 'var(--accent-dim)' : 'transparent' }}>
                  <input type="radio" name="medioPago" value={opt.value} checked={form.medioPago === opt.value} onChange={() => setField('medioPago', opt.value)} />
                  <i className={`ti ${opt.icon}`} style={{ color: form.medioPago === opt.value ? 'var(--accent)' : 'var(--text-sec)', fontSize: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Transferencia info */}
            {form.medioPago === 'TRANSFERENCIA' && (
              <div style={{ background: 'var(--info-dim)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12 }}>
                <div style={{ marginBottom: 6, fontWeight: 700, color: 'var(--info)' }}>Datos bancarios</div>
                <div style={{ color: 'var(--text-sec)' }}>CBU: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{CBU}</span></div>
                <div style={{ color: 'var(--text-sec)' }}>Alias: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{ALIAS}</span></div>
              </div>
            )}

            {/* Tarjeta fields */}
            {form.medioPago === 'TARJETA' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Número de tarjeta *</label>
                  <input className={errors.tarjetaNumero ? 'error' : ''} value={form.tarjetaNumero} onChange={e => setField('tarjetaNumero', e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="0000 0000 0000 0000" maxLength={16} />
                  {errors.tarjetaNumero && <div className="field-error">{errors.tarjetaNumero}</div>}
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Nombre en la tarjeta *</label>
                  <input className={errors.tarjetaNombre ? 'error' : ''} value={form.tarjetaNombre} onChange={e => setField('tarjetaNombre', e.target.value.toUpperCase())} placeholder="JUAN PEREZ" />
                  {errors.tarjetaNombre && <div className="field-error">{errors.tarjetaNombre}</div>}
                </div>
                <div className="field">
                  <label>Vencimiento *</label>
                  <input className={errors.tarjetaVenc ? 'error' : ''} value={form.tarjetaVenc} onChange={e => setField('tarjetaVenc', e.target.value)} placeholder="MM/AA" maxLength={5} />
                  {errors.tarjetaVenc && <div className="field-error">{errors.tarjetaVenc}</div>}
                </div>
                <div className="field">
                  <label>CVV *</label>
                  <input className={errors.tarjetaCVV ? 'error' : ''} value={form.tarjetaCVV} onChange={e => setField('tarjetaCVV', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" maxLength={4} />
                  {errors.tarjetaCVV && <div className="field-error">{errors.tarjetaCVV}</div>}
                </div>
              </div>
            )}
          </div>

          {errors.general && (
            <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13 }}>
              {errors.general}
            </div>
          )}

          <button className="btn btn-accent" onClick={handleSubmit} disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 15 }}>
            {submitting ? <><InlineSpinner size={15} /> Procesando...</> : <><i className="ti ti-check" /> Confirmar compra</>}
          </button>
        </div>

        {/* Right: summary */}
        <div className="card" style={{ position: 'sticky', top: 72 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Resumen del pedido
          </h3>
          {items.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 20 }}>Carrito vacío</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {items.map(item => {
                  const precio = parseFloat(item.precio || item.precioUnitario || 0);
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-sec)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nombre || item.productoNombre}
                        <span style={{ color: 'var(--text-dim)' }}> ×{item.cantidad}</span>
                      </span>
                      <span style={{ fontWeight: 600, flexShrink: 0 }}>${(precio * (item.cantidad || 1)).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-sec)', fontWeight: 700 }}>TOTAL</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
