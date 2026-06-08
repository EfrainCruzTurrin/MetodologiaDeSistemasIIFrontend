import { useState, useEffect } from 'react';

const ICONS = {
  success: 'ti-circle-check-filled', // Usamos el ícono relleno para más impacto
  error: 'ti-circle-x-filled',
  info: 'ti-info-circle-filled',
  warning: 'ti-alert-triangle-filled',
};

const COLORS = {
  success: { bg: 'var(--success-dim)', border: 'var(--success)', color: 'var(--success)' },
  error:   { bg: 'var(--danger-dim)',  border: 'var(--danger)',  color: 'var(--danger)' },
  info:    { bg: 'var(--info-dim)',    border: 'var(--info)',    color: 'var(--info)' },
  warning: { bg: 'var(--warning-dim)', border: 'var(--warning)', color: 'var(--warning)' },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para asegurar que el DOM pinte el estado inicial antes de animar
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const { bg, border, color } = COLORS[toast.type] || COLORS.info;
  const icon = ICONS[toast.type] || ICONS.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center', // Centrado vertical mejorado
        gap: 12,
        background: 'var(--surface)', // Fondo oscuro sólido
        borderLeft: `4px solid ${border}`, // Borde lateral estilo alerta moderna
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        maxWidth: 340,
        minWidth: 260,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Efecto rebote suave
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 400); // Esperar que termine la animación de salida
      }}
    >
      <i className={`ti ${icon}`} style={{ color, fontSize: 20, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 30, // Cambiado abajo a la derecha, suele ser menos intrusivo en e-commerce
        right: 30,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}