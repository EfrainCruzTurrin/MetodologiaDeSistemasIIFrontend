import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, getKits, agregarProductoCarrito, addKitToCarrito } from '../../api/api';
import { useCliente } from '../../context/ClienteContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/variables.css';

/* ─── Paleta de marcas ──────────────────────────────────────────────── */
const MARCAS_COLORES = [
  '#c8f55a', '#5ab4f5', '#f5c842', '#5af596', '#f55a5a',
  '#c45af5', '#f5915a', '#5af5e8',
];

function badgeColor(marca) {
  if (!marca) return MARCAS_COLORES[0];
  let hash = 0;
  for (let i = 0; i < marca.length; i++) hash = marca.charCodeAt(i) + ((hash << 5) - hash);
  return MARCAS_COLORES[Math.abs(hash) % MARCAS_COLORES.length];
}

/* ─── Estilos globales ─────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #0a0a0c; }
    ::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(200,245,90,0.3); }

    /* ── Keyframes ── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(32px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes splashIn {
      0%   { opacity: 0; transform: scale(0) rotate(-10deg); }
      60%  { opacity: 1; transform: scale(1.08) rotate(2deg); }
      100% { opacity: 1; transform: scale(1) rotate(0); }
    }
    @keyframes inkDrip {
      0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
      40%  { opacity: 1; }
      100% { transform: scaleY(1); transform-origin: top; opacity: 1; }
    }
    @keyframes floatOrb {
      0%,100% { transform: translateY(0) translateX(0) rotate(0deg); }
      33%      { transform: translateY(-30px) translateX(20px) rotate(5deg); }
      66%      { transform: translateY(15px) translateX(-15px) rotate(-3deg); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes pulseGlow {
      0%,100% { box-shadow: 0 0 0 0 rgba(90,245,150,0); }
      50%      { box-shadow: 0 0 10px 3px rgba(90,245,150,0.2); }
    }
    @keyframes cartBounce {
      0%   { transform: scale(1) rotate(0); }
      25%  { transform: scale(1.2) rotate(-8deg); }
      50%  { transform: scale(0.92) rotate(4deg); }
      75%  { transform: scale(1.05) rotate(-2deg); }
      100% { transform: scale(1) rotate(0); }
    }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes paintStroke {
      from { clip-path: inset(0 100% 0 0); }
      to   { clip-path: inset(0 0% 0 0); }
    }
    @keyframes countPop {
      0%  { transform: scale(0.5) rotate(-15deg); opacity: 0; }
      70% { transform: scale(1.25) rotate(3deg); opacity: 1; }
      100%{ transform: scale(1) rotate(0); opacity: 1; }
    }
    @keyframes rotateBlob {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-5px); }
      80%      { transform: translateX(5px); }
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(100%) scale(0.85); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(100%) scale(0.85); }
    }

    /* ── Backgrounds ── */
    .catalogo-page {
      min-height: 100vh;
      background: #080809;
      color: #e8e8e8;
      font-family: 'DM Sans', sans-serif;
      position: relative;
      overflow-x: hidden;
    }

    /* Paint splatter background */
    .paint-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .paint-blob {
      position: absolute;
      border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
      filter: blur(60px);
      pointer-events: none;
    }
    .pb-1 {
      width: 700px; height: 700px;
      background: radial-gradient(ellipse, rgba(200,245,90,0.07) 0%, transparent 70%);
      top: -200px; right: -150px;
      animation: floatOrb 18s ease-in-out infinite;
    }
    .pb-2 {
      width: 500px; height: 400px;
      background: radial-gradient(ellipse, rgba(90,180,245,0.05) 0%, transparent 70%);
      bottom: 5%; left: -100px;
      animation: floatOrb 24s ease-in-out infinite reverse;
    }
    .pb-3 {
      width: 350px; height: 350px;
      background: radial-gradient(ellipse, rgba(196,90,245,0.04) 0%, transparent 70%);
      top: 40%; left: 30%;
      animation: floatOrb 30s ease-in-out infinite 5s;
    }
    .pb-4 {
      width: 200px; height: 200px;
      background: radial-gradient(ellipse, rgba(245,90,90,0.04) 0%, transparent 70%);
      top: 20%; left: 60%;
      animation: floatOrb 20s ease-in-out infinite 8s reverse;
    }

    /* ── Skeleton ── */
    .skeleton-card {
      background: linear-gradient(90deg, #111114 25%, #1a1a1e 50%, #111114 75%);
      background-size: 600px 100%;
      animation: shimmer 1.8s infinite linear;
      border-radius: 16px;
      height: 340px;
      border: 1px solid rgba(255,255,255,0.04);
    }

    /* ── Fade in ── */
    .fade-in-up {
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* ── Card ── */
    .producto-card {
      background: #111114;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                  box-shadow 0.3s ease,
                  border-color 0.3s ease;
      will-change: transform;
    }
    .producto-card:hover {
      transform: translateY(-6px) scale(1.015);
      border-color: rgba(200,245,90,0.18);
      box-shadow: 0 24px 50px rgba(0,0,0,0.6),
                  0 0 0 1px rgba(200,245,90,0.08),
                  0 0 40px rgba(200,245,90,0.05);
    }
    .producto-card:hover .card-img-inner {
      transform: scale(1.07);
    }
    .producto-card:hover .card-price {
      background: linear-gradient(90deg, #fff 0%, #c8f55a 50%, #a8e040 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradientShift 2s linear infinite;
    }

    .kit-card {
      background: linear-gradient(145deg, #111114 0%, #13150f 100%);
      border-color: rgba(200,245,90,0.1);
    }
    .kit-card:hover {
      border-color: rgba(200,245,90,0.25);
      box-shadow: 0 24px 50px rgba(0,0,0,0.6),
                  0 0 0 1px rgba(200,245,90,0.12),
                  0 0 50px rgba(200,245,90,0.07);
    }

    /* ── Paint streak top accent ── */
    .card-paint-streak {
      height: 4px;
      width: 100%;
      position: relative;
      overflow: hidden;
    }
    .card-paint-streak::after {
      content: '';
      position: absolute;
      inset: 0;
      background: inherit;
      animation: paintStroke 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* ── Ink drip on hover ── */
    .ink-drip {
      position: absolute;
      bottom: 0; left: 50%;
      transform: translateX(-50%) scaleY(0);
      width: 2px;
      background: linear-gradient(to bottom, rgba(200,245,90,0.5), transparent);
      height: 30px;
      transform-origin: top;
      pointer-events: none;
      transition: transform 0.3s ease 0.1s;
      border-radius: 1px;
    }
    .producto-card:hover .ink-drip {
      transform: translateX(-50%) scaleY(1);
    }

    /* ── Img container ── */
    .card-img-wrap {
      position: relative;
      overflow: hidden;
      height: 160px;
      flex-shrink: 0;
    }
    .card-img-inner {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
    }
    .card-img-overlay {
      position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
      background: linear-gradient(to top, #111114, transparent);
      pointer-events: none;
    }
    .card-no-img {
      width: 100%; height: 160px;
      background: linear-gradient(135deg, #131316 0%, #1a1a1e 100%);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    .card-no-img::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 30% 40%, rgba(200,245,90,0.05) 0%, transparent 70%);
    }

    /* ── Card body ── */
    .card-body {
      padding: 14px 16px 16px;
      display: flex; flex-direction: column; gap: 8; flex: 1;
    }

    /* ── Badge agregar pulse ── */
    .badge-ok-pulse {
      animation: pulseGlow 2.8s ease-in-out infinite;
    }

    /* ── Btn agregar ── */
    .btn-agregar {
      position: relative; overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .btn-agregar:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(200,245,90,0.4);
    }
    .btn-agregar:active:not(:disabled) { transform: scale(0.93); }
    .btn-agregar::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
      transform: translateX(-100%);
      transition: transform 0.4s ease;
    }
    .btn-agregar:hover::before { transform: translateX(100%); }

    /* ── Carrito btn ── */
    .carrito-fab {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .carrito-fab:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 10px 32px rgba(200,245,90,0.45) !important;
    }
    .carrito-fab:active { transform: scale(0.95); }
    .carrito-fab.bouncing { animation: cartBounce 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

    /* ── Filter bar sticky ── */
    .filter-bar {
      position: sticky; top: 0; z-index: 20;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      background: rgba(8,8,9,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    /* ── Search input ── */
    .search-input:focus {
      border-color: rgba(200,245,90,0.45) !important;
      box-shadow: 0 0 0 3px rgba(200,245,90,0.07), inset 0 0 0 1px rgba(200,245,90,0.1);
      outline: none;
    }

    /* ── Select ── */
    .filter-select:focus { border-color: rgba(200,245,90,0.35) !important; outline: none; }

    /* ── Tab btn ── */
    .tab-btn {
      transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
    }
    .tab-btn:hover { transform: translateY(-1px); }
    .tab-btn:active { transform: scale(0.96); }

    /* ── Reset btn ── */
    .reset-btn { transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s; }
    .reset-btn:hover {
      background: rgba(200,245,90,0.07) !important;
      border-color: rgba(200,245,90,0.3) !important;
      color: #c8f55a !important;
      transform: translateY(-1px);
    }

    /* ── Toast ── */
    .toast-enter { animation: toastIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .toast-exit  { animation: toastOut 0.3s ease forwards; }

    /* ── Error shake ── */
    .error-shake { animation: shake 0.45s ease both; }

    /* ── Count badge ── */
    .count-pop { animation: countPop 0.4s cubic-bezier(0.16,1,0.3,1) both; }

    /* ── Section divider paint brush ── */
    .paint-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(200,245,90,0.25) 30%, rgba(90,180,245,0.15) 70%, transparent 100%);
      margin: 0 1.5rem;
      position: relative;
    }
    .paint-divider::after {
      content: '✦';
      position: absolute; top: -9px; left: 50%;
      transform: translateX(-50%);
      font-size: 10px; color: rgba(200,245,90,0.35);
      background: #080809; padding: 0 8px;
    }
  `}</style>
);

/* ─── StockBadge ────────────────────────────────────────────────────── */
function StockBadge({ stock, minimo }) {
  if (stock === 0)
    return (
      <span style={{ fontSize: 11, background: 'rgba(245,90,90,0.1)', color: '#f55a5a', padding: '3px 9px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(245,90,90,0.18)' }}>
        Sin stock
      </span>
    );
  if (stock <= minimo)
    return (
      <span style={{ fontSize: 11, background: 'rgba(245,200,66,0.1)', color: '#f5c842', padding: '3px 9px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(245,200,66,0.18)' }}>
        ⚡ Stock bajo
      </span>
    );
  return (
    <span className="badge-ok-pulse" style={{ fontSize: 11, background: 'rgba(90,245,150,0.08)', color: '#5af596', padding: '3px 9px', borderRadius: 4, fontWeight: 600, border: '1px solid rgba(90,245,150,0.18)' }}>
      ● Disponible
    </span>
  );
}

/* ─── SkeletonCard ──────────────────────────────────────────────────── */
function SkeletonCard() {
  return <div className="skeleton-card" />;
}

/* ─── Toast ─────────────────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }) {
  const iconMap = { success: 'ti-circle-check', error: 'ti-alert-circle', info: 'ti-info-circle' };
  const colorMap = {
    success: { bg: 'rgba(90,245,150,0.08)', border: 'rgba(90,245,150,0.2)', color: '#5af596' },
    error:   { bg: 'rgba(245,90,90,0.08)',  border: 'rgba(245,90,90,0.2)',  color: '#f55a5a' },
    info:    { bg: 'rgba(90,180,245,0.08)', border: 'rgba(90,180,245,0.2)', color: '#5ab4f5' },
  };
  const c = colorMap[toast.type] || colorMap.info;
  return (
    <div
      className="toast-enter"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 12,
        background: `linear-gradient(135deg, #111114, #0e0e11)`,
        border: `1px solid ${c.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${c.color}18`,
        fontSize: 13, maxWidth: 320, minWidth: 240,
        fontFamily: 'DM Sans, sans-serif',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: c.bg, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`ti ${iconMap[toast.type] || 'ti-info-circle'}`} style={{ color: c.color, fontSize: 15 }} />
      </div>
      <span style={{ flex: 1, color: '#e0e0e0', lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 2, flexShrink: 0 }}
      >
        <i className="ti ti-x" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

/* ─── ProductoCard ──────────────────────────────────────────────────── */
function ProductoCard({ producto, onAgregar, index }) {
  const [agregado, setAgregado] = useState(false);
  const [loading, setLoading] = useState(false);
  const color = badgeColor(producto.marca);

  async function handleAgregar() {
    setLoading(true);
    await onAgregar(producto);
    setLoading(false);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2200);
  }

  return (
    <div
      className="producto-card fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Paint streak */}
      <div
        className="card-paint-streak"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}66, transparent)`,
          animationDelay: `${index * 0.05 + 0.1}s`,
        }}
      />

      {/* Image */}
      {producto.imagenUrl ? (
        <div className="card-img-wrap">
          <img className="card-img-inner" src={producto.imagenUrl} alt={producto.nombre} />
          <div className="card-img-overlay" />
          <div className="ink-drip" style={{ background: `linear-gradient(to bottom, ${color}88, transparent)` }} />
        </div>
      ) : (
        <div className="card-no-img">
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-palette" style={{ fontSize: 36, color: color + '55' }} />
            <span style={{ fontSize: 10, color: '#333', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>SIN IMAGEN</span>
          </div>
        </div>
      )}

      <div className="card-body">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4, border: '1px solid',
            fontFamily: 'DM Mono, monospace',
            color, borderColor: color + '40', background: color + '10',
          }}>
            {producto.marca || 'Sin marca'}
          </span>
          <StockBadge stock={producto.stockActual} minimo={producto.stockMinimo} />
        </div>

        {/* Title */}
        <h3 style={{
          margin: '2px 0 0', fontSize: 15, fontWeight: 700,
          color: '#f0f0f0', lineHeight: 1.3,
          fontFamily: 'Playfair Display, serif',
          letterSpacing: '-0.1px',
        }}>
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>
            {producto.descripcion}
          </p>
        )}

        {/* Price */}
        <p
          className="card-price"
          style={{
            margin: 0, fontSize: 21, fontWeight: 700, color: '#fff',
            letterSpacing: '-0.5px', fontFamily: 'DM Mono, monospace',
            transition: 'color 0.2s',
          }}
        >
          ${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#444', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-package" style={{ fontSize: 13, marginRight: 4, color: '#3a3a42' }} />
            {producto.stockActual}
          </span>

          <button
            className="btn-agregar"
            onClick={handleAgregar}
            disabled={producto.stockActual === 0 || agregado || loading}
            style={
              agregado
                ? { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(90,245,150,0.07)', color:'#5af596', border:'1px solid rgba(90,245,150,0.2)', borderRadius:8, fontWeight:700, fontSize:12, cursor:'default', fontFamily:'DM Sans, sans-serif' }
                : producto.stockActual === 0
                ? { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#0d0d10', color:'#2a2a30', border:'1px solid #1a1a1e', borderRadius:8, fontWeight:700, fontSize:12, cursor:'not-allowed', fontFamily:'DM Sans, sans-serif' }
                : { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'linear-gradient(135deg, #c8f55a 0%, #a8d840 100%)', color:'#080809', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif', boxShadow:'0 3px 12px rgba(200,245,90,0.2)' }
            }
          >
            {loading
              ? <><i className="ti ti-loader-2" style={{ fontSize:13, animation:'spin 0.8s linear infinite' }} /> Agregando...</>
              : agregado
              ? <><i className="ti ti-check" style={{fontSize:13}}/> ¡Listo!</>
              : <><i className="ti ti-shopping-cart-plus" style={{fontSize:13}}/> Agregar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── KitCard ───────────────────────────────────────────────────────── */
function KitCard({ kit, onAgregar, stockMap, index }) {
  const [agregado, setAgregado] = useState(false);
  const [loading, setLoading] = useState(false);

  const stockKit = kit.productos?.length
    ? Math.min(...kit.productos.map(kp => {
        const stock = stockMap[kp.productoId] ?? 0;
        return Math.floor(stock / (kp.cantidad || 1));
      }))
    : 0;
  const sinStock = stockKit === 0;

  async function handleAgregar() {
    setLoading(true);
    await onAgregar(kit);
    setLoading(false);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2200);
  }

  return (
    <div
      className="producto-card kit-card fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Paint streak – gradient verde */}
      <div
        className="card-paint-streak"
        style={{ background: 'linear-gradient(90deg, #c8f55a, #5af596, transparent)', animationDelay: `${index * 0.05 + 0.1}s` }}
      />

      {/* Fondo watermark KIT */}
      <div style={{
        position: 'absolute', top: 12, right: 14, opacity: 0.04,
        fontSize: 58, fontWeight: 900, fontFamily: 'Playfair Display, serif',
        color: '#c8f55a', lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
        letterSpacing: '-2px',
      }}>KIT</div>

      <div className="card-body" style={{ position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(200,245,90,0.3)',
            fontFamily: 'DM Mono, monospace', color: '#c8f55a', background: 'rgba(200,245,90,0.06)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="ti ti-box-multiple" style={{ fontSize: 10 }} /> Kit
          </span>
          {sinStock
            ? <span style={{ fontSize:11, background:'rgba(245,90,90,0.1)', color:'#f55a5a', padding:'3px 9px', borderRadius:4, fontWeight:600, border:'1px solid rgba(245,90,90,0.18)' }}>Sin stock</span>
            : <span className="badge-ok-pulse" style={{ fontSize:11, background:'rgba(90,245,150,0.08)', color:'#5af596', padding:'3px 9px', borderRadius:4, fontWeight:600, border:'1px solid rgba(90,245,150,0.18)' }}>● Disponible</span>
          }
        </div>

        <h3 style={{
          margin: '2px 0 0', fontSize: 16, fontWeight: 700,
          color: '#f0f0f0', lineHeight: 1.3,
          fontFamily: 'Playfair Display, serif', letterSpacing: '-0.1px',
        }}>
          {kit.nombre}
        </h3>

        {kit.descripcion && (
          <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5 }}>{kit.descripcion}</p>
        )}

        {/* Productos en kit */}
        {kit.productos?.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2,
          }}>
            {kit.productos.slice(0, 3).map((kp, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4,
                background: 'rgba(200,245,90,0.04)', border: '1px solid rgba(200,245,90,0.1)',
                color: '#555', fontFamily: 'DM Mono, monospace',
              }}>
                {kp.cantidad}× {kp.productoNombre || kp.nombre || 'Producto'}
              </span>
            ))}
            {kit.productos.length > 3 && (
              <span style={{ fontSize:10, color:'#444', padding:'2px 6px', fontFamily:'DM Mono, monospace' }}>
                +{kit.productos.length - 3} más
              </span>
            )}
          </div>
        )}

        <p
          className="card-price"
          style={{ margin: 0, fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: 'DM Mono, monospace' }}
        >
          ${Number(kit.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 10,
          borderTop: '1px solid rgba(200,245,90,0.07)', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#444', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-box-multiple" style={{ fontSize: 13, marginRight: 4, color: '#3a3a42' }} />
            {kit.productos?.length ?? 0} prod.
          </span>

          <button
            className="btn-agregar"
            onClick={handleAgregar}
            disabled={sinStock || agregado || loading}
            style={
              agregado
                ? { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(90,245,150,0.07)', color:'#5af596', border:'1px solid rgba(90,245,150,0.2)', borderRadius:8, fontWeight:700, fontSize:12, cursor:'default', fontFamily:'DM Sans, sans-serif' }
                : sinStock
                ? { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#0d0d10', color:'#2a2a30', border:'1px solid #1a1a1e', borderRadius:8, fontWeight:700, fontSize:12, cursor:'not-allowed', fontFamily:'DM Sans, sans-serif' }
                : { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'linear-gradient(135deg, #c8f55a 0%, #a8d840 100%)', color:'#080809', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif', boxShadow:'0 3px 12px rgba(200,245,90,0.2)' }
            }
          >
            {loading
              ? <><i className="ti ti-loader-2" style={{ fontSize:13 }} /> Agregando...</>
              : agregado
              ? <><i className="ti ti-check" style={{fontSize:13}}/> ¡Listo!</>
              : <><i className="ti ti-shopping-cart-plus" style={{fontSize:13}}/> Agregar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CatalogoPage ──────────────────────────────────────────────────── */
export default function CatalogoPage() {
  const { carritoId } = useCliente();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast?.() ?? { toasts: [], showToast: () => {}, removeToast: () => {} };

  const [productos, setProductos] = useState([]);
  const [kits, setKits] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [ordenPrecio, setOrdenPrecio] = useState('');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [verKits, setVerKits] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [cartBouncing, setCartBouncing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    Promise.all([getProductos(), getKits()])
      .then(([prods, ks]) => {
        setProductos(prods || []);
        setKits(ks || []);
        setFiltrados(prods || []);
      })
      .catch(() => setError('No se pudo cargar el catálogo.'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    let lista = [...productos];
    if (busqueda) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q)
      );
    }
    if (marcaFiltro) lista = lista.filter(p => p.marca === marcaFiltro);
    if (soloDisponibles) lista = lista.filter(p => p.stockActual > 0);
    if (ordenPrecio === 'asc') lista.sort((a, b) => a.precio - b.precio);
    if (ordenPrecio === 'desc') lista.sort((a, b) => b.precio - a.precio);
    setFiltrados(lista);
  }, [busqueda, marcaFiltro, ordenPrecio, soloDisponibles, productos]);

  const stockMap = Object.fromEntries(productos.map(p => [p.id, p.stockActual]));
  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))];

  function triggerCartBounce() {
    setCartBouncing(true);
    setTimeout(() => setCartBouncing(false), 600);
  }

  async function handleAgregar(producto) {
    try {
      await agregarProductoCarrito(carritoId, { productoId: producto.id, cantidad: 1 });
      setCarrito(prev => {
        const existe = prev.find(i => i.id === producto.id);
        if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
        return [...prev, { id: producto.id, cantidad: 1 }];
      });
      triggerCartBounce();
      showToast?.(`${producto.nombre} agregado al carrito`, 'success');
    } catch (err) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('stock')) showToast?.('Sin stock suficiente', 'error');
      else showToast?.('No se pudo agregar al carrito', 'error');
      throw err;
    }
  }

  async function handleAgregarKit(kit) {
    try {
      await addKitToCarrito(carritoId, kit.id);
      setCarrito(prev => {
        const existe = prev.find(i => i.kitId === kit.id);
        if (existe) return prev.map(i => i.kitId === kit.id ? { ...i, cantidad: i.cantidad + 1 } : i);
        return [...prev, { kitId: kit.id, cantidad: 1 }];
      });
      triggerCartBounce();
      showToast?.(`Kit "${kit.nombre}" agregado`, 'success');
    } catch {
      showToast?.('No se pudo agregar el kit', 'error');
    }
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const hayFiltros = busqueda || marcaFiltro || soloDisponibles || ordenPrecio;

  function resetFiltros() {
    setBusqueda(''); setMarcaFiltro(''); setOrdenPrecio(''); setSoloDisponibles(false);
  }

  const inputStyle = {
    width: '100%', padding: '9px 36px 9px 38px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, color: '#e8e8e8', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const selectStyle = {
    padding: '9px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, color: '#e8e8e8', fontSize: 14,
    cursor: 'pointer', outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'border-color 0.2s',
  };

  return (
    <>
      <GlobalStyles />
      <ToastContainer toasts={toasts ?? []} onRemove={removeToast} />

      <div className="catalogo-page" style={{ position: 'relative', zIndex: 1 }}>

        {/* Paint blob background */}
        <div className="paint-bg">
          <div className="paint-blob pb-1" />
          <div className="paint-blob pb-2" />
          <div className="paint-blob pb-3" />
          <div className="paint-blob pb-4" />

          {/* SVG organic paint splatter */}
          <svg
            style={{ position: 'absolute', top: '15%', right: '5%', width: 220, height: 220, opacity: 0.04, pointerEvents: 'none' }}
            viewBox="0 0 200 200"
          >
            <path fill="#c8f55a" d="M45,-60C58,-50,68,-35,72,-18C76,-1,73,17,65,32C57,47,43,58,28,65C12,71,-5,73,-22,70C-39,67,-56,58,-66,44C-76,30,-79,10,-75,-8C-71,-27,-59,-44,-44,-55C-29,-66,-14,-71,2,-73C18,-75,31,-70,45,-60Z" transform="translate(100 100)" />
          </svg>
          <svg
            style={{ position: 'absolute', bottom: '20%', left: '8%', width: 160, height: 160, opacity: 0.03, pointerEvents: 'none' }}
            viewBox="0 0 200 200"
          >
            <path fill="#5ab4f5" d="M50,-65C63,-55,71,-38,74,-20C77,-2,75,17,67,33C59,50,45,64,28,71C12,78,-7,78,-24,72C-42,65,-58,52,-67,36C-77,19,-80,0,-76,-17C-72,-35,-62,-51,-48,-61C-34,-71,-17,-75,0,-75C17,-74,37,-75,50,-65Z" transform="translate(100 100)" />
          </svg>
        </div>

        {/* ─── Top bar ─── */}
        <div
          className="filter-bar"
          style={{ padding: '0 1.5rem', position: 'relative', zIndex: 20 }}
        >
          {/* Título */}
          <div style={{
            padding: '1.4rem 0 0',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(200,245,90,0.12), rgba(200,245,90,0.04))',
                  border: '1px solid rgba(200,245,90,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="ti ti-palette" style={{ color: '#c8f55a', fontSize: 18 }} />
                </div>
                <div>
                  <h1 style={{
                    margin: 0, fontSize: 24, fontWeight: 900, color: '#fff',
                    fontFamily: 'Playfair Display, serif', letterSpacing: '-0.5px', lineHeight: 1.1,
                  }}>
                    Catálogo<span style={{ color: '#c8f55a' }}>.</span>
                  </h1>
                  <p style={{ margin: 0, fontSize: 12, color: '#444', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.3px' }}>
                    Pinturas · Pinceles · Insumos artísticos
                  </p>
                </div>
              </div>
            </div>

            {/* Carrito FAB */}
            <button
              className={`carrito-fab ${cartBouncing ? 'bouncing' : ''}`}
              onClick={() => navigate('/carrito')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px',
                background: totalCarrito > 0
                  ? 'linear-gradient(135deg, #c8f55a 0%, #a8d840 100%)'
                  : 'rgba(255,255,255,0.04)',
                color: totalCarrito > 0 ? '#080809' : '#888',
                border: totalCarrito > 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', position: 'relative',
                boxShadow: totalCarrito > 0 ? '0 4px 20px rgba(200,245,90,0.25)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: 16 }} />
              Carrito
              {totalCarrito > 0 && (
                <span
                  key={totalCarrito}
                  className="count-pop"
                  style={{
                    background: '#080809', color: '#c8f55a', borderRadius: '50%',
                    width: 22, height: 22, fontSize: 11, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 0 0 1px rgba(200,245,90,0.3)',
                    fontFamily: 'DM Mono, monospace',
                  }}
                >
                  {totalCarrito}
                </span>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 0 0' }}>
            {[
              { id: false, label: 'Productos', icon: 'ti-package', count: productos.length },
              { id: true,  label: 'Kits',      icon: 'ti-box-multiple', count: kits.length },
            ].map(tab => (
              <button
                key={tab.id.toString()}
                className="tab-btn"
                onClick={() => setVerKits(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px',
                  background: verKits === tab.id ? 'rgba(200,245,90,0.08)' : 'transparent',
                  border: verKits === tab.id ? '1px solid rgba(200,245,90,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, color: verKits === tab.id ? '#c8f55a' : '#555',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: verKits === tab.id ? '0 0 20px rgba(200,245,90,0.05)' : 'none',
                }}
              >
                <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
                {tab.label}
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 10, fontFamily: 'DM Mono, monospace',
                  background: verKits === tab.id ? 'rgba(200,245,90,0.12)' : 'rgba(255,255,255,0.04)',
                  color: verKits === tab.id ? '#c8f55a' : '#444',
                  border: verKits === tab.id ? '1px solid rgba(200,245,90,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filtros */}
          {!verKits && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              padding: '10px 0 12px', alignItems: 'center',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
                <i className="ti ti-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#444', fontSize:15, pointerEvents:'none' }} />
                <input
                  ref={inputRef}
                  className="search-input"
                  style={inputStyle}
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#555', cursor:'pointer', display:'flex', alignItems:'center' }}
                  >
                    <i className="ti ti-x" style={{ fontSize: 14 }} />
                  </button>
                )}
              </div>

              {/* Marca */}
              <select
                className="filter-select"
                style={selectStyle}
                value={marcaFiltro}
                onChange={e => setMarcaFiltro(e.target.value)}
              >
                <option value="">Todas las marcas</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Orden */}
              <select
                className="filter-select"
                style={selectStyle}
                value={ordenPrecio}
                onChange={e => setOrdenPrecio(e.target.value)}
              >
                <option value="">Precio</option>
                <option value="asc">Menor a mayor</option>
                <option value="desc">Mayor a menor</option>
              </select>

              {/* Solo disponibles */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: soloDisponibles ? '#c8f55a' : '#666', fontSize: 13, userSelect: 'none', transition: 'color 0.2s', fontFamily: 'DM Sans, sans-serif' }}>
                <input
                  type="checkbox"
                  checked={soloDisponibles}
                  onChange={e => setSoloDisponibles(e.target.checked)}
                  style={{ accentColor: '#c8f55a', width: 14, height: 14 }}
                />
                Disponibles
              </label>

              {/* Reset */}
              {hayFiltros && (
                <button
                  className="reset-btn"
                  onClick={resetFiltros}
                  style={{
                    padding: '7px 14px', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#555', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <i className="ti ti-filter-off" style={{ fontSize: 13 }} /> Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Contenido ─── */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Error */}
          {error && (
            <div
              className="error-shake"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                margin: '2rem 1.5rem', padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(245,90,90,0.08), rgba(245,90,90,0.03))',
                border: '1px solid rgba(245,90,90,0.2)',
                borderRadius: 12, color: '#f55a5a', fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(245,90,90,0.1)', border: '1px solid rgba(245,90,90,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 16 }} />
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {cargando && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 18, padding: '1.5rem',
            }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Productos */}
          {!cargando && !error && !verKits && (
            <>
              {filtrados.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'5rem 2rem', gap:14, color:'#333' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(200,245,90,0.04)', border: '1px solid rgba(200,245,90,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-paint-off" style={{ fontSize: 32, color: '#2a2a30' }} />
                  </div>
                  <p style={{ margin:0, fontSize:15, fontFamily:'DM Sans, sans-serif' }}>
                    No hay productos que coincidan
                  </p>
                  {hayFiltros && (
                    <button
                      onClick={resetFiltros}
                      style={{
                        padding: '8px 20px', background: 'rgba(200,245,90,0.06)',
                        border: '1px solid rgba(200,245,90,0.2)',
                        borderRadius: 8, color: '#c8f55a',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      }}
                    >
                      <i className="ti ti-refresh" style={{ marginRight: 6 }} />Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 1.5rem 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#333', fontFamily: 'DM Mono, monospace' }}>
                      {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
                    </span>
                    {hayFiltros && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(200,245,90,0.05)', border: '1px solid rgba(200,245,90,0.12)', color: '#c8f55a88', fontFamily: 'DM Mono, monospace' }}>
                        filtrado
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))',
                    gap: 18, padding: '0.75rem 1.5rem 3rem',
                  }}>
                    {filtrados.map((p, i) => (
                      <ProductoCard key={p.id} producto={p} onAgregar={handleAgregar} index={i} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Kits */}
          {!cargando && !error && verKits && (
            <>
              {kits.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'5rem 2rem', gap:14, color:'#333' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(200,245,90,0.04)', border: '1px solid rgba(200,245,90,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-box-off" style={{ fontSize: 32, color: '#2a2a30' }} />
                  </div>
                  <p style={{ margin:0, fontSize:15, fontFamily:'DM Sans, sans-serif' }}>
                    No hay kits disponibles
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 1.5rem 4px' }}>
                    <span style={{ fontSize: 11, color: '#333', fontFamily: 'DM Mono, monospace' }}>
                      {kits.length} kit{kits.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 18, padding: '0.75rem 1.5rem 3rem',
                  }}>
                    {kits.map((k, i) => (
                      <KitCard key={k.id} kit={k} onAgregar={handleAgregarKit} stockMap={stockMap} index={i} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}