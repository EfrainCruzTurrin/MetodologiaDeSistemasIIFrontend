import { useState } from 'react';
import { registrarCliente } from '../../api/api';
import { InlineSpinner } from '../../components/shared/LoadingSpinner';

const ALLOWED_DOMAINS = [
  'gmail.com', 'gmail.com.ar',
  'hotmail.com', 'hotmail.com.ar',
  'yahoo.com', 'yahoo.com.ar',
  'outlook.com', 'outlook.com.ar',
];

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

function passwordStrength(pass) {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte'];
const STRENGTH_COLORS = ['', 'var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)'];

function validate(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.';
  if (!form.apellido.trim()) errors.apellido = 'El apellido es requerido.';
  if (!form.email.trim()) {
    errors.email = 'El email es requerido.';
  } else if (!validateEmail(form.email)) {
    errors.email = 'Email inválido o dominio no permitido (gmail, hotmail, yahoo, outlook).';
  }
  if (!form.password) {
    errors.password = 'La contraseña es requerida.';
  } else if (form.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!form.pais.trim()) errors.pais = 'El país es requerido.';
  if (!form.provincia.trim()) errors.provincia = 'La provincia es requerida.';
  if (!form.localidad.trim()) errors.localidad = 'La localidad es requerida.';
  if (!form.calle.trim()) errors.calle = 'La calle es requerida.';
  if (!form.numeroCalle || isNaN(parseInt(form.numeroCalle))) errors.numeroCalle = 'El número es requerido.';
  
  return errors;
}

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '',
    pais: '', provincia: '', localidad: '', calle: '', numeroCalle: '', depto: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState(null);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const strength = passwordStrength(form.password);

  const handleSubmit = async () => {
    setServerError(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await registrarCliente({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        direccion: {
          pais: form.pais.trim(),
          provincia: form.provincia.trim(),
          localidad: form.localidad.trim(),
          calle: form.calle.trim(),
          numeroCalle: parseInt(form.numeroCalle),
          depto: form.depto.trim(),
        },
      });
      setSuccess(form.email.trim().toLowerCase());
    } catch (err) {
      if (err?.status === 409 || err?.campo === 'email' || err?.message?.toLowerCase().includes('email')) {
        setErrors({ email: 'Este email ya está registrado.' });
      } else {
        setServerError(err?.message || 'Error al registrar. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#f0fdf4', border: '2px solid #86efac',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <i className="ti ti-check" style={{ color: '#22c55e', fontSize: 28 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>¡Registro exitoso!</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>Tu cuenta fue creada con el email:</p>
          <p style={{ color: '#111', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{success}</p>
          <a href="/login" style={{
            display: 'inline-block', padding: '10px 24px',
            background: 'var(--accent)', color: '#0f0f11',
            borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <i className="ti ti-user-plus" style={{ fontSize: 28, color: 'var(--accent)', background: 'var(--accent-dim)', padding: 12, borderRadius: '50%' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginTop: 12, marginBottom: 4 }}>Crear cuenta</h1>
          <p style={{ color: '#888', fontSize: 13 }}>Completá tus datos para registrarte</p>
        </div>

        {serverError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#ef4444', fontSize: 13 }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{serverError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nombre + Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nombre *" error={errors.nombre}>
              <input style={inputStyle(errors.nombre)} value={form.nombre} onChange={e => setField('nombre', e.target.value)} placeholder="Juan" />
            </Field>
            <Field label="Apellido *" error={errors.apellido}>
              <input style={inputStyle(errors.apellido)} value={form.apellido} onChange={e => setField('apellido', e.target.value)} placeholder="Pérez" />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email *" error={errors.email} hint="Dominios aceptados: gmail, hotmail, yahoo, outlook">
            <input style={inputStyle(errors.email)} type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="vos@gmail.com" />
          </Field>

          {/* Password */}
          <Field label="Contraseña *" error={errors.password}>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle(errors.password), paddingRight: 40 }}
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder="Mín. 8 caracteres"
              />
              <button onClick={() => setShowPass(v => !v)} style={eyeBtn}>
                <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= strength ? STRENGTH_COLORS[strength] : '#e0e0e0',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: STRENGTH_COLORS[strength], fontWeight: 600 }}>
                  {STRENGTH_LABELS[strength]}
                </div>
              </div>
            )}
          </Field>

          {/* Separador dirección */}
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="ti ti-map-pin" style={{ marginRight: 6 }} />Dirección
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* País + Provincia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="País *" error={errors.pais}>
                  <input style={inputStyle(errors.pais)} value={form.pais} onChange={e => setField('pais', e.target.value)} placeholder="Argentina" />
                </Field>
                <Field label="Provincia *" error={errors.provincia}>
                  <input style={inputStyle(errors.provincia)} value={form.provincia} onChange={e => setField('provincia', e.target.value)} placeholder="Buenos Aires" />
                </Field>
              </div>

              {/* Localidad */}
              <Field label="Localidad *" error={errors.localidad}>
                <input style={inputStyle(errors.localidad)} value={form.localidad} onChange={e => setField('localidad', e.target.value)} placeholder="CABA" />
              </Field>

              {/* Calle + Número */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Field label="Calle *" error={errors.calle}>
                  <input style={inputStyle(errors.calle)} value={form.calle} onChange={e => setField('calle', e.target.value)} placeholder="Av. Corrientes" />
                </Field>
                <Field label="Número *" error={errors.numeroCalle}>
                  <input style={inputStyle(errors.numeroCalle)} type="number" value={form.numeroCalle} onChange={e => setField('numeroCalle', e.target.value)} placeholder="1234" />
                </Field>
              </div>

              {/* Depto */}
              <Field label="Piso / Depto " error={errors.depto}>
                <input style={inputStyle(errors.depto)} value={form.depto} onChange={e => setField('depto', e.target.value)} placeholder="Piso 3 Depto B" />
              </Field>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#ccc' : 'var(--accent)',
              color: '#0f0f11', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, fontFamily: 'sans-serif',
            }}
          >
            {loading ? <><InlineSpinner size={14} /> Registrando...</> : <><i className="ti ti-user-plus" /> Crear cuenta</>}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
            ¿Ya tenés cuenta?{' '}
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Iniciá sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${hasError ? '#f87171' : '#e0e0e0'}`,
  fontSize: 14, outline: 'none', color: '#111', background: '#fff',
  fontFamily: 'sans-serif', transition: 'border-color 0.15s', boxSizing: 'border-box',
});

const eyeBtn = {
  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16, padding: 2,
};

const pageStyle = {
  minHeight: 'calc(100vh - 52px)', background: '#f5f5f3',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'sans-serif', padding: '24px 20px',
};

const cardStyle = {
  background: '#fff', borderRadius: 14, padding: '32px 28px',
  width: '100%', maxWidth: 480, boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
};