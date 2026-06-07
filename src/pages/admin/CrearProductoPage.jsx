import { useState } from 'react';
import { crearProducto } from '../../api/api';
import { InlineSpinner } from '../../components/shared/LoadingSpinner';

function validate(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.';
  if (!form.marca.trim()) errors.marca = 'La marca es requerida.';
  if (form.precio === '' || isNaN(parseFloat(form.precio))) errors.precio = 'Ingresá un precio válido.';
  else if (parseFloat(form.precio) <= 0) errors.precio = 'El precio debe ser positivo.';
  if (form.stockActual === '' || isNaN(parseInt(form.stockActual))) errors.stockActual = 'Ingresá un stock válido.';
  else if (parseInt(form.stockActual) <= 0) errors.stockActual = 'El stock debe ser positivo.';
  if (form.stockMinimo === '' || isNaN(parseInt(form.stockMinimo))) errors.stockMinimo = 'Ingresá un stock mínimo válido.';
  else if (parseInt(form.stockMinimo) <= 0) errors.stockMinimo = 'El stock mínimo debe ser positivo.';
  return errors;
}

export default function CrearProductoPage() {
  const [form, setForm] = useState({
    nombre: '',
    marca: '',
    descripcion: '',
    precio: '',
    stockActual: '',
    stockMinimo: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);

  const handleField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    setServerError(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    const data = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: parseFloat(form.precio),
      stockActual: parseInt(form.stockActual),
      stockMinimo: parseInt(form.stockMinimo),
    };

    try {
      const result = await crearProducto(data);
      setSuccess({ ...data, id: result.id });
    } catch (err) {
      setServerError(err?.message || 'Error al crear el producto. Verificá los datos e intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ nombre: '', marca: '', precio: '', stockActual: '', stockMinimo: '' });
    setErrors({});
    setSuccess(null);
    setServerError(null);
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--success-dim)', border: '2px solid var(--success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="ti ti-check" style={{ color: 'var(--success)', fontSize: 24 }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>¡Producto creado!</h2>
            <p style={{ color: 'var(--text-sec)', fontSize: 13, marginTop: 6 }}>
              El producto fue cargado exitosamente al sistema.
            </p>
          </div>

          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '14px 16px', textAlign: 'left', marginBottom: 20 }}>
            {[
              ['Nombre', success.nombre],
              ['Marca', success.marca],
              ...(success.descripcion ? [['Descripción', success.descripcion]] : []),
              ['Precio', `$${success.precio.toFixed(2)}`],
              ['Stock actual', `${success.stockActual} unidades`],
              ['Stock mínimo', `${success.stockMinimo} unidades`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-sec)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-accent" style={{ width: '100%' }} onClick={handleReset}>
            <i className="ti ti-plus" /> Cargar otro producto
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <i className="ti ti-plus" style={{ marginRight: 8, color: 'var(--accent)' }} />
              Nuevo Producto
            </h1>
            <p className="page-subtitle">Completá los datos para agregar un insumo al catálogo</p>
          </div>
        </div>

        {serverError && (
          <div style={{
            background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
            color: 'var(--danger)', fontSize: 13,
          }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{serverError}
          </div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Nombre */}
          <div className="field">
            <label>Nombre *</label>
            <input
              className={errors.nombre ? 'error' : ''}
              value={form.nombre}
              onChange={e => handleField('nombre', e.target.value)}
              placeholder="Ej: Pintura corporal azul 100ml"
            />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
          </div>

          {/* Marca */}
          <div className="field">
            <label>Marca *</label>
            <input
              className={errors.marca ? 'error' : ''}
              value={form.marca}
              onChange={e => handleField('marca', e.target.value)}
              placeholder="Ej: Snazaroo"
            />
            {errors.marca && <div className="field-error">{errors.marca}</div>}
          </div>

          {/* Descripción */}
          <div className="field">
            <label>Descripción <span style={{ color: 'var(--text-sec)', fontWeight: 400, fontSize: 12 }}>(opcional)</span></label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={e => handleField('descripcion', e.target.value)}
              placeholder="Ej: Pintura apta para piel sensible, resistente al agua…"
              style={{ resize: 'vertical', minHeight: 72 }}
            />
          </div>

          {/* Precio */}
          <div className="field">
            <label>Precio *</label>
            <input
              type="number" min="0" step="0.01"
              className={errors.precio ? 'error' : ''}
              value={form.precio}
              onChange={e => handleField('precio', e.target.value)}
              placeholder="0.00"
            />
            {errors.precio && <div className="field-error">{errors.precio}</div>}
          </div>

          {/* Stock actual + Stock mínimo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>Stock actual *</label>
              <input
                type="number" min="1"
                className={errors.stockActual ? 'error' : ''}
                value={form.stockActual}
                onChange={e => handleField('stockActual', e.target.value)}
                placeholder="0"
              />
              {errors.stockActual && <div className="field-error">{errors.stockActual}</div>}
            </div>
            <div className="field">
              <label>Stock mínimo *</label>
              <input
                type="number" min="1"
                className={errors.stockMinimo ? 'error' : ''}
                value={form.stockMinimo}
                onChange={e => handleField('stockMinimo', e.target.value)}
                placeholder="0"
              />
              {errors.stockMinimo && <div className="field-error">{errors.stockMinimo}</div>}
            </div>
          </div>

          <button
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
          >
            {loading ? (
              <><InlineSpinner size={14} /> Creando producto...</>
            ) : (
              <><i className="ti ti-check" /> Crear producto</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
