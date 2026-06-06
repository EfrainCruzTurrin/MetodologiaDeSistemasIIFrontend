import { useState, useEffect } from 'react';
import { useCliente } from '../../context/ClienteContext';
import {
  crearCuponMonto,
  crearCuponPorcentaje,
  asignarClientesCupon,
  getClientes,
  getCuponesPorVendedor,
} from '../../api/api';
import { InlineSpinner } from '../../components/shared/LoadingSpinner';

// Convierte yyyy-MM-dd (input date) → dd/MM/yyyy (backend)
const toApiDate = (input) => {
  if (!input) return '';
  const [y, m, d] = input.split('-');
  return `${d}/${m}/${y}`;
};

export default function CuponesVendedorPage() {
  const { clienteId: vendedorId } = useCliente();

  // ── Wizard: 'form' | 'clientes' | 'exito' ─────────────────────────────────
  const [step, setStep] = useState('form');

  // ── Estado de cupones existentes ───────────────────────────────────────────
  const [cupones,        setCupones]        = useState([]);
  const [cuponesLoading, setCuponesLoading] = useState(true);

  // ── Estado de clientes ─────────────────────────────────────────────────────
  const [clientes,        setClientes]        = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [busqueda,        setBusqueda]        = useState('');
  const [seleccionados,   setSeleccionados]   = useState([]);

  // ── Cupón recién creado ────────────────────────────────────────────────────
  const [cuponCreado, setCuponCreado] = useState(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [submitting,   setSubmitting]   = useState(false);
  const [asignando,    setAsignando]    = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [errors,       setErrors]       = useState({});

  // ── Formulario ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    tipo: 'MontoFijo',        // 'MontoFijo' | 'Porcentaje'
    fechaInicio: '',
    fechaVencimiento: '',
    montoDescuento: '',
    montoMinimoCompra: '',
    porcentaje: '',
  });

  // ── Cargar cupones existentes al montar ────────────────────────────────────
  useEffect(() => {
    getCuponesPorVendedor(vendedorId)
      .then(data => setCupones(Array.isArray(data) ? data : []))
      .catch(() => setCupones([]))
      .finally(() => setCuponesLoading(false));
  }, [vendedorId]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
    setServerError('');
  };

  // ── Validación ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.fechaInicio)      e.fechaInicio      = 'Requerido.';
    if (!form.fechaVencimiento) e.fechaVencimiento = 'Requerido.';
    if (form.fechaInicio && form.fechaVencimiento && form.fechaInicio >= form.fechaVencimiento) {
      e.fechaVencimiento = 'Debe ser posterior a la fecha de inicio.';
    }
    if (form.tipo === 'MontoFijo') {
      if (!form.montoDescuento   || parseFloat(form.montoDescuento)   <= 0) e.montoDescuento   = 'Debe ser mayor a 0.';
      if (!form.montoMinimoCompra || parseFloat(form.montoMinimoCompra) <= 0) e.montoMinimoCompra = 'Debe ser mayor a 0.';
    } else {
      if (!form.porcentaje) {
        e.porcentaje = 'Requerido.';
      } else {
        const p = parseFloat(form.porcentaje);
        if (p < 0.01 || p > 99.99) e.porcentaje = 'Debe ser entre 0.01 y 99.99.';
      }
    }
    return e;
  };

  // ── Crear cupón ────────────────────────────────────────────────────────────
  const handleCrearCupon = async () => {
    setServerError('');
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSubmitting(true);
    try {
      let cupon;
      if (form.tipo === 'MontoFijo') {
        cupon = await crearCuponMonto({
          fechaInicio:      toApiDate(form.fechaInicio),
          fechaVencimiento: toApiDate(form.fechaVencimiento),
          montoDescuento:   parseFloat(form.montoDescuento),
          montoMinimoCompra: parseFloat(form.montoMinimoCompra),
        }, vendedorId);
      } else {
        cupon = await crearCuponPorcentaje({
          fechaInicio:      toApiDate(form.fechaInicio),
          fechaVencimiento: toApiDate(form.fechaVencimiento),
          porcentaje:       parseFloat(form.porcentaje),
        }, vendedorId);
      }

      setCuponCreado(cupon);
      setCupones(prev => [cupon, ...prev]);

      // Cargar lista de clientes para el paso 2
      setClientesLoading(true);
      const data = await getClientes();
      setClientes(Array.isArray(data) ? data : []);
      setStep('clientes');
    } catch (err) {
      setServerError(err?.message || 'Error al crear el cupón. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
      setClientesLoading(false);
    }
  };

  // ── Asignar clientes y enviar emails ───────────────────────────────────────
  const handleAsignarClientes = async () => {
    if (seleccionados.length === 0) {
      setServerError('Seleccioná al menos un cliente.');
      return;
    }
    setAsignando(true);
    setServerError('');
    try {
      await asignarClientesCupon(cuponCreado.id, seleccionados);
      setStep('exito');
    } catch (err) {
      setServerError(err?.message || 'Error al asignar clientes.');
    } finally {
      setAsignando(false);
    }
  };

  // ── Resetear para crear otro cupón ─────────────────────────────────────────
  const handleReset = () => {
    setCuponCreado(null);
    setSeleccionados([]);
    setBusqueda('');
    setErrors({});
    setServerError('');
    setForm({ tipo: 'MontoFijo', fechaInicio: '', fechaVencimiento: '', montoDescuento: '', montoMinimoCompra: '', porcentaje: '' });
    setStep('form');
  };

  const toggleSeleccionado = (id) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clientesFiltrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = [
    { key: 'form',     label: '1. Crear cupón',      icon: 'ti-ticket'       },
    { key: 'clientes', label: '2. Asignar clientes',  icon: 'ti-users'        },
    { key: 'exito',    label: '3. Listo',             icon: 'ti-circle-check' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  const sectionTitle = (label) => (
    <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
      {label}
    </h3>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-ticket" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Cupones de Descuento
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 13, marginTop: 4 }}>
            Creá cupones y asignalos a clientes. Cada cliente recibirá el código por email.
          </p>
        </div>
        {step !== 'form' && (
          <button className="btn btn-ghost" onClick={handleReset}>
            <i className="ti ti-plus" /> Nuevo cupón
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {steps.map((s, i) => {
          const isActive = s.key === step;
          const isDone   = i < stepIndex;
          const color    = isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-dim)';
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? 'var(--success-dim)' : isActive ? 'var(--accent-dim)' : 'var(--surface2)',
                  border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ${isDone ? 'ti-check' : s.icon}`} style={{ color, fontSize: 14 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: isDone ? 'var(--success)' : 'var(--border)', margin: '0 14px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error global */}
      {serverError && (
        <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, color: 'var(--danger)', fontSize: 13 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{serverError}
        </div>
      )}

      {/* Layout: main + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: step === 'exito' ? '1fr' : '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Panel principal ────────────────────────────────────────────── */}
        <div>

          {/* PASO 1: Formulario */}
          {step === 'form' && (
            <div className="card">
              {sectionTitle('Datos del cupón')}

              {/* Tipo de descuento */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)', display: 'block', marginBottom: 8 }}>
                  Tipo de descuento
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { value: 'MontoFijo',   label: 'Monto fijo',  icon: 'ti-currency-dollar', desc: 'Ej: $500 de descuento' },
                    { value: 'Porcentaje',  label: 'Porcentaje',  icon: 'ti-percentage',       desc: 'Ej: 15% de descuento' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '12px 14px',
                      border: `1px solid ${form.tipo === opt.value ? 'var(--accent-border)' : 'var(--border2)'}`,
                      borderRadius: 'var(--radius)',
                      background: form.tipo === opt.value ? 'var(--accent-dim)' : 'transparent',
                    }}>
                      <input
                        type="radio" name="tipo" value={opt.value}
                        checked={form.tipo === opt.value}
                        onChange={() => setField('tipo', opt.value)}
                      />
                      <i className={`ti ${opt.icon}`} style={{ color: form.tipo === opt.value ? 'var(--accent)' : 'var(--text-sec)', fontSize: 18 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="field">
                  <label>Fecha de inicio *</label>
                  <input
                    type="date"
                    className={errors.fechaInicio ? 'error' : ''}
                    value={form.fechaInicio}
                    onChange={e => setField('fechaInicio', e.target.value)}
                  />
                  {errors.fechaInicio && <div className="field-error">{errors.fechaInicio}</div>}
                </div>
                <div className="field">
                  <label>Fecha de vencimiento *</label>
                  <input
                    type="date"
                    className={errors.fechaVencimiento ? 'error' : ''}
                    value={form.fechaVencimiento}
                    min={form.fechaInicio || undefined}
                    onChange={e => setField('fechaVencimiento', e.target.value)}
                  />
                  {errors.fechaVencimiento && <div className="field-error">{errors.fechaVencimiento}</div>}
                </div>
              </div>

              {/* Campos según tipo */}
              {form.tipo === 'MontoFijo' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="field">
                    <label>Monto de descuento ($) *</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className={errors.montoDescuento ? 'error' : ''}
                      value={form.montoDescuento}
                      onChange={e => setField('montoDescuento', e.target.value)}
                      placeholder="500.00"
                    />
                    {errors.montoDescuento && <div className="field-error">{errors.montoDescuento}</div>}
                  </div>
                  <div className="field">
                    <label>Monto mínimo de compra ($) *</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className={errors.montoMinimoCompra ? 'error' : ''}
                      value={form.montoMinimoCompra}
                      onChange={e => setField('montoMinimoCompra', e.target.value)}
                      placeholder="1000.00"
                    />
                    {errors.montoMinimoCompra && <div className="field-error">{errors.montoMinimoCompra}</div>}
                  </div>
                </div>
              ) : (
                <div className="field" style={{ maxWidth: 220 }}>
                  <label>Porcentaje de descuento (%) *</label>
                  <input
                    type="number" step="0.01" min="0.01" max="99.99"
                    className={errors.porcentaje ? 'error' : ''}
                    value={form.porcentaje}
                    onChange={e => setField('porcentaje', e.target.value)}
                    placeholder="15.00"
                  />
                  {errors.porcentaje && <div className="field-error">{errors.porcentaje}</div>}
                </div>
              )}

              <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

              <button
                className="btn btn-accent"
                onClick={handleCrearCupon}
                disabled={submitting}
                style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14 }}
              >
                {submitting
                  ? <><InlineSpinner size={14} /> Creando cupón...</>
                  : <><i className="ti ti-arrow-right" /> Crear cupón y continuar</>
                }
              </button>
            </div>
          )}

          {/* PASO 2: Asignar clientes */}
          {step === 'clientes' && (
            <div className="card">
              {/* Banner del cupón generado */}
              <div style={{
                background: 'var(--accent-dim)', border: '1px dashed var(--accent-border)',
                borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <i className="ti ti-ticket" style={{ color: 'var(--accent)', fontSize: 22, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cupón generado
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--accent)' }}>
                    {cuponCreado?.codigo}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-sec)' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {cuponCreado?.porcentaje != null
                      ? `${cuponCreado.porcentaje}%`
                      : `$${parseFloat(cuponCreado?.montoDescuento || 0).toFixed(2)}`
                    }
                  </div>
                  <div>Vence {cuponCreado?.fechaVencimiento}</div>
                </div>
              </div>

              {sectionTitle('Seleccioná los clientes')}

              {/* Búsqueda */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 14, pointerEvents: 'none' }} />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 32, fontSize: 13, padding: '8px 10px 8px 32px', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)' }}
                />
              </div>

              {/* Seleccionar todos */}
              {clientesFiltrados.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-sec)', padding: '6px 2px', marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={clientesFiltrados.length > 0 && clientesFiltrados.every(c => seleccionados.includes(c.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        setSeleccionados(prev => [...new Set([...prev, ...clientesFiltrados.map(c => c.id)])]);
                      } else {
                        setSeleccionados(prev => prev.filter(id => !clientesFiltrados.map(c => c.id).includes(id)));
                      }
                    }}
                  />
                  Seleccionar todos ({clientesFiltrados.length})
                </label>
              )}

              {/* Lista de clientes */}
              {clientesLoading ? (
                <div style={{ textAlign: 'center', padding: 28 }}><InlineSpinner size={18} /></div>
              ) : clientesFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-dim)', fontSize: 13 }}>
                  <i className="ti ti-users-off" style={{ fontSize: 22, display: 'block', marginBottom: 6 }} />
                  {busqueda ? 'No hay resultados para esa búsqueda.' : 'No hay clientes registrados.'}
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {clientesFiltrados.map(c => {
                    const sel = seleccionados.includes(c.id);
                    return (
                      <label key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '9px 12px',
                        border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border2)'}`,
                        borderRadius: 'var(--radius)',
                        background: sel ? 'var(--accent-dim)' : 'transparent',
                      }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleSeleccionado(c.id)} />
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)' }}>
                            {c.nombre?.[0]}{c.apellido?.[0]}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nombre} {c.apellido}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                        </div>
                        {sel && <i className="ti ti-check" style={{ color: 'var(--accent)', fontSize: 14, flexShrink: 0 }} />}
                      </label>
                    );
                  })}
                </div>
              )}

              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={handleReset} style={{ flexShrink: 0 }}>
                  <i className="ti ti-arrow-left" /> Cancelar
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleAsignarClientes}
                  disabled={asignando || seleccionados.length === 0}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {asignando
                    ? <><InlineSpinner size={14} /> Enviando emails...</>
                    : <><i className="ti ti-send" /> Asignar y enviar emails ({seleccionados.length})</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Éxito */}
          {step === 'exito' && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
              <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-dim)', border: '2px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="ti ti-circle-check" style={{ color: 'var(--success)', fontSize: 24 }} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>¡Cupón enviado!</h2>
                <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 20 }}>
                  Se enviaron <strong>{seleccionados.length}</strong> email{seleccionados.length !== 1 ? 's' : ''} con el cupón de descuento.
                </p>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Código del cupón
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.15em', color: 'var(--accent)' }}>
                    {cuponCreado?.codigo}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 8 }}>
                    {cuponCreado?.porcentaje != null
                      ? `${cuponCreado.porcentaje}% de descuento`
                      : `$${parseFloat(cuponCreado?.montoDescuento || 0).toFixed(2)} de descuento`
                    }
                    {' · '}
                    Válido hasta {cuponCreado?.fechaVencimiento}
                  </div>
                </div>
                <button className="btn btn-accent" onClick={handleReset} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
                  <i className="ti ti-plus" /> Crear otro cupón
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: historial ─────────────────────────────────────────── */}
        {step !== 'exito' && (
          <div className="card" style={{ position: 'sticky', top: 72 }}>
            {sectionTitle('Cupones creados')}

            {cuponesLoading ? (
              <div style={{ textAlign: 'center', padding: 20 }}><InlineSpinner size={16} /></div>
            ) : cupones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>
                <i className="ti ti-ticket-off" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />
                No hay cupones todavía.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                {cupones.map(c => {
                  const esPorcentaje = c.porcentaje != null;
                  return (
                    <div key={c.id} style={{ padding: '10px 12px', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--surface2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent)' }}>
                          {c.codigo}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          color:       esPorcentaje ? 'var(--info)'    : 'var(--success)',
                          background:  esPorcentaje ? 'var(--info-dim)' : 'var(--success-dim)',
                        }}>
                          {esPorcentaje ? `${c.porcentaje}%` : `$${parseFloat(c.montoDescuento).toFixed(2)}`}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Vence: {c.fechaVencimiento}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}