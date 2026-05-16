import { useEffect } from 'react';
import { InlineSpinner } from './LoadingSpinner';

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  confirmVariant = 'accent',
  loading = false,
  children,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyle =
    confirmVariant === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-accent';

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '100%',
          maxWidth: 420,
          animation: 'slideUp 0.18s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-sec)', fontSize: 18, lineHeight: 1, padding: 2 }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {message && (
          <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
        )}

        {children && (
          <div style={{ marginBottom: 20 }}>{children}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className={confirmStyle} onClick={onConfirm} disabled={loading}>
            {loading && <InlineSpinner size={13} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
