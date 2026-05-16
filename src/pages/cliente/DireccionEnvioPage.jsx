import { useState, useEffect } from 'react';
import { registrarDireccionEnvio, getDireccionesEnvio } from '../../api/api';
import { useCliente } from '../../context/ClienteContext';
import { InlineSpinner } from '../../components/shared/LoadingSpinner';

const ONLY_LETTERS = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-]+$/;
const ONLY_NUMBERS = /^[0-9]+$/;

function validate(form) {
  const errors = {};
  if (!form.pais.trim()) errors.pais = 'El país es requerido.';
  else if (!ONLY_LETTERS.test(form.pais.trim())) errors.pais = 'El país solo debe contener letras.';
  if (!form.provincia.trim()) errors.provincia = 'La provincia es requerida.';
  else if (!ONLY_LETTERS.test(form.provincia.trim())) errors.provincia = 'La provincia solo debe contener letras.';
  if (!form.localidad.trim()) errors.localidad = 'La localidad es requerida.';
  else if (!ONLY_LETTERS.test(form.localidad.trim())) errors.localidad = 'La localidad solo debe contener letras.';
  if (!form.calle.trim()) errors.calle = 'La calle es requerida.';
  if (!form.numero.trim()) errors.numero = 'El número es requerido.';
  else if (!ONLY_NUMBERS.test(form.numero.trim())) errors.numero = 'El número debe ser solo dígitos.';
  return errors;
}

const EMPTY_FORM = { pais: '', provincia: '', localidad: '', calle: '', numero: '', piso: '', depto: '' };

export default function DireccionEnvioPage() {
  const { clienteId } = useCliente();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [newDireccion, setNewDireccion] = useState(null);

  useEffect(() => {
    getDireccionesEnvio(clienteId)
      .then(data => setDirecciones(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [clienteId]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    setServerError(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const result = await registrarDireccionEnvio(clienteId, {
        pais: form.pais.trim(),
        provincia: form.provincia.trim(),
        localidad: form.localidad.trim(),
        calle: form.calle.trim(),
        numero: form.numero.trim(),
        piso: form.piso.trim() || undefined,
        departamento: form.depto.trim() || undefined,
      });
      setNewDireccion(result);
      setDirecciones(prev => [...prev, result]);
      setForm(EMPTY_FORM);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('conflict')) {
        setServerError('Esta dirección ya está registrada para tu cuenta.');
      } else {
        setServerError(msg || 'Error al registrar la dirección. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <i className="ti ti-map-pin" style={{ marginRight: 8, color: 'var(--accent)' }} />
              Dirección de envío
            </h1>
            <p className="page-subtitle">Registrá un domicilio para recibir tus pedidos</p>
          </div>
        </div>

        {/* Existing addresses */}
        {direcciones.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Direcciones registradas ({direcciones.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {direcciones.map((d, idx) => (
                <div key={d?.id ?? idx} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <i className="ti ti-map-pin" style={{ color: 'var(--accent)', fontSize: 16, marginTop: 1 }} />
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{d.calle} {d.numero}{d.piso ? `, piso ${d.piso}` : ''}{d.departamento ? ` depto ${d.departamento}` : ''}</div>
                    <div style={{ color: 'var(--text-sec)', fontSize: 12 }}>{d.localidad}, {d.provincia}, {d.pais}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success notice */}
        {newDireccion && (
          <div style={{
            background: 'var(--success-dim)', border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16,
            color: 'var(--success)', fontSize: 13,
          }}>
            <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
            Dirección registrada. Podés agregar otra si querés.
          </div>
        )}

        {/* Error */}
        {serverError && (
          <div style={{
            background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16,
            color: 'var(--danger)', fontSize: 13,
          }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{serverError}
          </div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nueva dirección
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>País *</label>
              <input className={errors.pais ? 'error' : ''} value={form.pais} onChange={e => setField('pais', e.target.value)} placeholder="Argentina" />
              {errors.pais && <div className="field-error">{errors.pais}</div>}
            </div>
            <div className="field">
              <label>Provincia *</label>
              <input className={errors.provincia ? 'error' : ''} value={form.provincia} onChange={e => setField('provincia', e.target.value)} placeholder="Córdoba" />
              {errors.provincia && <div className="field-error">{errors.provincia}</div>}
            </div>
          </div>

          <div className="field">
            <label>Localidad *</label>
            <input className={errors.localidad ? 'error' : ''} value={form.localidad} onChange={e => setField('localidad', e.target.value)} placeholder="Las Varillas" />
            {errors.localidad && <div className="field-error">{errors.localidad}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 14 }}>
            <div className="field">
              <label>Calle *</label>
              <input className={errors.calle ? 'error' : ''} value={form.calle} onChange={e => setField('calle', e.target.value)} placeholder="Av. San Martín" />
              {errors.calle && <div className="field-error">{errors.calle}</div>}
            </div>
            <div className="field">
              <label>Número *</label>
              <input className={errors.numero ? 'error' : ''} value={form.numero} onChange={e => setField('numero', e.target.value)} placeholder="1234" />
              {errors.numero && <div className="field-error">{errors.numero}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>Piso <span style={{ color: 'var(--text-dim)' }}>(opcional)</span></label>
              <input value={form.piso} onChange={e => setField('piso', e.target.value)} placeholder="3" />
            </div>
            <div className="field">
              <label>Departamento <span style={{ color: 'var(--text-dim)' }}>(opcional)</span></label>
              <input value={form.depto} onChange={e => setField('depto', e.target.value)} placeholder="B" />
            </div>
          </div>

          <button
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', padding: 11, fontSize: 14, marginTop: 4 }}
          >
            {submitting
              ? <><InlineSpinner size={14} /> Guardando...</>
              : <><i className="ti ti-map-pin" /> Registrar dirección</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
