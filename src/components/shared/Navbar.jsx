import { NavLink, useNavigate } from 'react-router-dom';
import { useCliente } from '../../context/ClienteContext';

const adminLinks = [
  { to: '/admin/productos',       label: 'Productos',       icon: 'ti-package'         },
  { to: '/admin/crear-producto',  label: 'Crear Producto',  icon: 'ti-plus'            },
  { to: '/admin/baja-producto',   label: 'Dar de Baja',     icon: 'ti-trash'           },
  { to: '/admin/importar-imagen', label: 'Importar Imagen', icon: 'ti-photo'           }, // ← estaba faltando
  { to: '/admin/kits',            label: 'Kits',            icon: 'ti-box-multiple'    },
  { to: '/admin/pedidos',         label: 'Pedidos',         icon: 'ti-clipboard-list'  },
  { to: '/admin/reporte-ventas',  label: 'Reporte Ventas',  icon: 'ti-chart-bar'       },
  { to: '/admin/reporte-stock',   label: 'Reporte Stock',   icon: 'ti-alert-triangle'  },
];

const vendedorLinks = [
  { to: '/vendedor/pedidos',  label: 'Pedidos', icon: 'ti-clipboard-list' },
  { to: '/vendedor/cupones',  label: 'Cupones', icon: 'ti-ticket'         },
];

const clienteLinks = [
  { to: '/catalogo',         label: 'Catálogo',          icon: 'ti-shopping-bag'  },
  { to: '/carrito',          label: 'Carrito',            icon: 'ti-shopping-cart' },
  { to: '/confirmar-pedido', label: 'Confirmar Pedido',   icon: 'ti-check'         },
  { to: '/direccion-envio',  label: 'Dirección de Envío', icon: 'ti-map-pin'       },
];

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 10px',
  borderRadius: 'var(--radius)',
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  color: isActive ? 'var(--accent)' : 'var(--text-sec)',
  background: isActive ? 'var(--accent-dim)' : 'transparent',
  transition: 'all 0.12s',
});

export default function Navbar() {
  const { isLoggedIn, isAdmin, isCliente, isVendedor, nombre, logout } = useCliente();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // No logueado: solo logo
  if (!isLoggedIn) {
    return (
      <nav style={navStyle}>
        <NavLink to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <i className="ti ti-droplet-filled" style={{ color: 'var(--accent)', fontSize: 18 }} />
          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            BODY<span style={{ color: 'var(--accent)' }}>PAINTING</span>
          </span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <NavLink
        to={isAdmin ? '/admin/productos' : isVendedor ? '/vendedor/pedidos' : '/catalogo'}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 24, flexShrink: 0, textDecoration: 'none' }}
      >
        <i className="ti ti-droplet-filled" style={{ color: 'var(--accent)', fontSize: 18 }} />
        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          BODY<span style={{ color: 'var(--accent)' }}>PAINTING</span>
        </span>
      </NavLink>

      <div style={{ width: 1, height: 24, background: 'var(--border2)', marginRight: 20, flexShrink: 0 }} />

      {/* Links según rol */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={labelStyle}>ADMIN</span>
          {adminLinks.map(link => (
            <NavLink key={link.to} to={link.to} style={linkStyle}>
              <i className={`ti ${link.icon}`} style={{ fontSize: 14 }} />
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {isVendedor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <span style={labelStyle}>VENDEDOR</span>
          {vendedorLinks.map(link => (
            <NavLink key={link.to} to={link.to} style={linkStyle}>
              <i className={`ti ${link.icon}`} style={{ fontSize: 14 }} />
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {isCliente && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {clienteLinks.map(link => (
            <NavLink key={link.to} to={link.to} style={linkStyle}>
              <i className={`ti ${link.icon}`} style={{ fontSize: 14 }} />
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Usuario + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>
          <i className="ti ti-user" style={{ marginRight: 4 }} />{nombre}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
            color: 'var(--danger)', borderRadius: 'var(--radius)',
            padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: 13 }} /> Salir
        </button>
      </div>
    </nav>
  );
}

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  height: 52,
  overflowX: 'auto',
};

const labelStyle = {
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginRight: 8,
  flexShrink: 0,
};