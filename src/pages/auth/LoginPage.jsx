import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCliente } from '../../context/ClienteContext';
import { login as loginApi } from '../../api/api';
import { InlineSpinner } from '../../components/shared/LoadingSpinner';

export default function LoginPage() {
  const { login } = useCliente();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginApi(form.email, form.password);
      login(data);
      if (data.rol === 'ADMIN') navigate('/admin/productos');
      else if (data.rol === 'VENDEDOR') navigate('/vendedor/pedidos');
      else navigate('/catalogo');
    } catch (err) {
      setError(err?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <i className="ti ti-droplet-filled" style={{ color: 'var(--accent)', fontSize: 36 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '8px 0 4px' }}>
            BODY<span style={{ color: 'var(--accent)' }}>PAINTING</span>
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 13 }}>Iniciá sesión para continuar</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--danger)', fontSize: 13,
            }}>
              <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleField('email', e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => handleField('password', e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            className="btn btn-accent"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}
          >
            {loading ? <><InlineSpinner size={14} /> Ingresando...</> : <><i className="ti ti-login" /> Ingresar</>}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-sec)' }}>
            ¿No tenés cuenta?{' '}
            <a href="/registro" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Registrate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}