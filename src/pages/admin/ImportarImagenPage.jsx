import { useState, useRef, useCallback, useEffect } from 'react';
import { getProductos, importarImagenProducto } from '../../api/api';
import LoadingSpinner, { InlineSpinner } from '../../components/shared/LoadingSpinner';
import Toast from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';

export default function ImportarImagenPage() {
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const fileRef = useRef();

  useEffect(() => {
    getProductos()
      .then(data => setProductos(data.filter(p => p.activo !== false)))
      .catch(() => showToast('No se pudo cargar la lista de productos.', 'error'))
      .finally(() => setLoadingProductos(false));
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setError('Solo se permiten archivos .jpg o .png.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5MB.');
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedId) { setError('Seleccioná un producto.'); return; }
    if (!file) { setError('Seleccioná una imagen.'); return; }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('imagen', file);
    try {
      await importarImagenProducto(selectedId, formData);
      showToast('Imagen importada correctamente.', 'success');
      setSuccess(true);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err?.message || 'Error al importar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProductos) return <LoadingSpinner message="Cargando productos..." />;

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <i className="ti ti-photo-up" style={{ marginRight: 8, color: 'var(--accent)' }} />
              Importar Imagen
            </h1>
            <p className="page-subtitle">Asociá una imagen a un producto existente</p>
          </div>
        </div>

        {success && (
          <div style={{
            background: 'var(--success-dim)', border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
            color: 'var(--success)', fontSize: 13,
          }}>
            <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
            Imagen importada. Podés subir otra imagen a otro producto.
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16,
            color: 'var(--danger)', fontSize: 13,
          }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
          </div>
        )}

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field">
            <label>Producto *</label>
            <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setError(null); setSuccess(false); }}>
              <option value="">— Seleccioná un producto —</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Imagen *
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: preview ? 0 : '32px 20px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
                background: dragging ? 'var(--accent-dim)' : 'transparent',
                overflow: 'hidden',
              }}
            >
              {preview ? (
                <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
              ) : (
                <>
                  <i className="ti ti-photo" style={{ fontSize: 32, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>
                    Arrastrá o <span style={{ color: 'var(--accent)' }}>seleccioná</span> la imagen
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>.jpg / .png — máx 5MB</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file && <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 5 }}>{file.name} — {(file.size / 1024).toFixed(0)} KB</div>}
          </div>

          <button className="btn btn-accent" onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 11, fontSize: 14 }}>
            {loading ? <><InlineSpinner size={14} /> Importando...</> : <><i className="ti ti-upload" /> Importar imagen</>}
          </button>
        </div>
      </div>
    </div>
  );
}
