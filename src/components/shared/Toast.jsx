import { useState, useEffect } from 'react';

const ICONS = {
  success: 'ti-circle-check',
  error: 'ti-circle-x',
  info: 'ti-info-circle',
  warning: 'ti-alert-triangle',
};

const COLORS = {
  success: { bg: 'var(--success-dim)', border: 'var(--success-border)', color: 'var(--success)' },
  error:   { bg: 'var(--danger-dim)',  border: 'var(--danger-border)',  color: 'var(--danger)' },
  info:    { bg: 'var(--info-dim)',    border: 'var(--info-border)',    color: 'var(--info)' },
  warning: { bg: 'var(--warning-dim)', border: 'var(--warning-border)', color: 'var(--warning)' },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const { bg, border, color } = COLORS[toast.type] || COLORS.info;
  const icon = ICONS[toast.type] || ICONS.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        maxWidth: 340,
        minWidth: 240,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <i className={`ti ${icon}`} style={{ color, fontSize: 16, marginTop: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{toast.message}</span>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
