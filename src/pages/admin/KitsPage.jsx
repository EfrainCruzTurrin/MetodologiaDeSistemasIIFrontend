import { useState, useEffect } from 'react';
import { getProductos, getKits, crearKit, deleteKit } from '../../api/api';
import LoadingSpinner, { InlineSpinner } from '../../components/shared/LoadingSpinner';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';

export default function KitsPage() {
  const [productos, setProductos] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const [form, setForm] = useState({ nombre: '', precio: '' });
  const [componentes, setComponentes] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Error 3 — estado para manejar el kit que se está eliminando
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    Promise.all([getProductos(), getKits()])
      .then(([prods, kts]) => {
        setProductos(prods.filter(p => p.activo !== false));
        setKits(kts);
      })
      .catch(() => showToast('Error al cargar datos.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const allItems = [
    ...productos.map(p => ({ ...p, tipo: 'PRODUCTO', displayName: `[Producto] ${p.nombre}` })),
    ...kits.map(k => ({ ...k, tipo: 'KIT', displayName: `[Kit] ${k.nombre}` })),
  ];

  const handleAddComponente = () => {
    if (!selectedItem) return;
    const item = allItems.find(i => `${i.tipo}-${i.id}` === selectedItem);
    if (!item) return;
    if (componentes.find(c => c.id === item.id && c.tipo === item.tipo)) {
      showToast('Este componente ya fue agregado.', 'warning');
      return;
    }
    setComponentes(prev => [...prev, { id: item.id, tipo: item.tipo, nombre: item.nombre, precio: item.precio }]);
    setSelectedItem('');
  };

  const removeComponente = (id, tipo) => {
    setComponentes(prev => prev.filter(c => !(c.id === id && c.tipo === tipo)));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido.';
    if (form.precio === '' || isNaN(parseFloat(form.precio))) errs.precio = 'Ingresá un precio válido.';
    else if (parseFloat(form.precio) < 0) errs.precio = 'El precio no puede ser negativo.';
    if (componentes.length === 0) errs.componentes = 'Agregá al menos un componente al kit.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const nuevo = await crearKit({
        nombre: form.nombre.trim(),
        precio: parseFloat(form.precio),
        componentes: componentes.map(c => ({ id: c.id, tipo: c.tipo })),
      });
      setKits(prev => [...prev, nuevo]);
      setForm({ nombre: '', precio: '' });
      setComponentes([]);
      setErrors({});
      showToast(`Kit "${nuevo.nombre || form.nombre}" creado correctamente.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Error al crear el kit.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Error 3 — handler para eliminar kit con confirmación
  const handleDeleteKit = async (kit) => {
    if (!window.confirm(`¿Eliminar el kit "${kit.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(kit.id);
    try {
      await deleteKit(kit.id);
      setKits(prev => prev.filter(k => k.id !== kit.id));
      showToast(`Kit "${kit.nombre}" eliminado.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Error al eliminar el kit.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando kits y productos..." />;

  return (
    <div className="page">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="ti ti-box-multiple" style={{ marginRight: 8, color: 'var(--accent)' }} />
            Gestión de Kits
          </h1>
          <p className="page-subtitle">Creá kits combinando productos y/o kits existentes</p>
        </div>
      </div>

      {/* Creator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Left: form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>Nuevo kit</h3>

          <div className="field">
            <label>Nombre del kit *</label>
            <input
              className={errors.nombre ? 'error' : ''}
              value={form.nombre}
              onChange={e => { setForm(p => ({ ...p, nombre: e.target.value })); setErrors(p => ({ ...p, nombre: undefined })); }}
              placeholder="Ej: Kit básico de iniciación"
            />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
          </div>

          <div className="field">
            <label>Precio del kit *</label>
            <input
              type="number" min="0" step="0.01"
              className={errors.precio ? 'error' : ''}
              value={form.precio}
              onChange={e => { setForm(p => ({ ...p, precio: e.target.value })); setErrors(p => ({ ...p, precio: undefined })); }}
              placeholder="0.00"
            />
            {errors.precio && <div className="field-error">{errors.precio}</div>}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Agregar componente
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                style={{ flex: 1, background: 'var(--surface2)', border: `1px solid ${errors.componentes ? 'var(--danger-border)' : 'var(--border2)'}`, borderRadius: 'var(--radius)', color: 'var(--text)', padding: '8px 10px' }}
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
              >
                <option value="">— Seleccioná —</option>
                {allItems.map(i => (
                  <option key={`${i.tipo}-${i.id}`} value={`${i.tipo}-${i.id}`}>{i.displayName}</option>
                ))}
              </select>
              <button className="btn btn-ghost" onClick={handleAddComponente}>
                <i className="ti ti-plus" />
              </button>
            </div>
            {errors.componentes && <div className="field-error" style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.componentes}</div>}
          </div>

          <button className="btn btn-accent" onClick={handleSubmit} disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? <><InlineSpinner size={13} /> Creando...</> : <><i className="ti ti-check" /> Crear kit</>}
          </button>
        </div>

        {/* Right: chips */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 14 }}>
            Componentes seleccionados
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-dim)', fontWeight: 400 }}>({componentes.length})</span>
          </h3>

          {componentes.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '24px 0' }}>
              <i className="ti ti-box" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              Agregá componentes desde el formulario
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {componentes.map(c => (
                <div key={`${c.tipo}-${c.id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '8px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${c.tipo === 'KIT' ? 'badge-info' : 'badge-accent'}`}>
                      {c.tipo}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>${parseFloat(c.precio || 0).toFixed(2)}</span>
                    <button
                      onClick={() => removeComponente(c.id, c.tipo)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 14, padding: 2 }}
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-sec)' }}>Suma de componentes: </span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  ${componentes.reduce((sum, c) => sum + (parseFloat(c.precio) || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kits list */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Kits existentes ({kits.length})
      </h2>

      {kits.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <i className="ti ti-box-off" />
            <p>No hay kits creados todavía.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Componentes</th>
                {/* Error 3 — columna acciones */}
                <th style={{ width: 80, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {kits.map(k => (
                <tr key={k.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{k.id}</td>
                  <td style={{ fontWeight: 600 }}>{k.nombre}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>${parseFloat(k.precio || 0).toFixed(2)}</td>
                  <td>
                    <span style={{ color: 'var(--text-sec)', fontSize: 12 }}>
                      {k.productos?.length ?? 0} componente(s)
                    </span>
                  </td>
                  {/* Error 3 — botón eliminar */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-ghost"
                      title="Eliminar kit"
                      disabled={deletingId === k.id}
                      onClick={() => handleDeleteKit(k)}
                      style={{ color: 'var(--danger)', padding: '4px 8px' }}
                    >
                      {deletingId === k.id
                        ? <InlineSpinner size={13} />
                        : <i className="ti ti-trash" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}