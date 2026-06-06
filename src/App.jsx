import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClienteProvider, useCliente } from './context/ClienteContext';

// Shared
import Navbar from './components/shared/Navbar';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import ReporteStockPage from './pages/admin/ReporteStockPage';
import ProductosPage from './pages/admin/ProductosPage';
import CrearProductoPage from './pages/admin/CrearProductoPage';
import BajaProductoPage from './pages/admin/BajaProductoPage';
import ImportarImagenPage from './pages/admin/ImportarImagenPage';
import KitsPage from './pages/admin/KitsPage';
import GestionPedidosPage from './pages/admin/GestionPedidosPage';
import ReporteVentasPage from './pages/admin/ReporteVentasPage';

// Vendedor pages
import VendedorPedidosPage from './pages/vendedor/VendedorPedidosPage';
import CuponesVendedorPage from './pages/vendedor/CuponesVendedorPage';

// Cliente pages
import RegistroPage from './pages/cliente/RegistroPage';
import CarritoPage from './pages/cliente/CarritoPage';
import ConfirmarPedidoPage from './pages/cliente/ConfirmarPedidoPage';
import DireccionEnvioPage from './pages/cliente/DireccionEnvioPage';
import CatalogoPage from './pages/cliente/CatalogoPage';

// ─── Guards ───────────────────────────────────────────────

function RutaAdmin({ children }) {
  const { isLoggedIn, isAdmin } = useCliente();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/login" replace />;
  return children;
}

function RutaVendedor({ children }) {
  const { isLoggedIn, isVendedor } = useCliente();
  if (!isLoggedIn)  return <Navigate to="/login" replace />;
  if (!isVendedor)  return <Navigate to="/login" replace />;
  return children;
}

function RutaCliente({ children }) {
  const { isLoggedIn, isCliente } = useCliente();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isCliente)  return <Navigate to="/admin/productos" replace />;
  return children;
}

function RutaPublica({ children }) {
  const { isLoggedIn, isAdmin, isVendedor } = useCliente();
  if (!isLoggedIn)  return children;
  if (isAdmin)      return <Navigate to="/admin/productos" replace />;
  if (isVendedor)   return <Navigate to="/vendedor/pedidos" replace />;
  return <Navigate to="/catalogo" replace />;
}

// ─── App ──────────────────────────────────────────────────

export default function App() {
  return (
    <ClienteProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>

          {/* Auth */}
          <Route path="/login"   element={<RutaPublica><LoginPage /></RutaPublica>} />
          <Route path="/registro" element={<RutaPublica><RegistroPage /></RutaPublica>} />

          {/* Admin */}
          <Route path="/admin/reporte-stock" element={<RutaAdmin><ReporteStockPage /></RutaAdmin>} />
          <Route path="/admin/productos"       element={<RutaAdmin><ProductosPage /></RutaAdmin>} />
          <Route path="/admin/crear-producto"  element={<RutaAdmin><CrearProductoPage /></RutaAdmin>} />
          <Route path="/admin/baja-producto"   element={<RutaAdmin><BajaProductoPage /></RutaAdmin>} />
          <Route path="/admin/importar-imagen" element={<RutaAdmin><ImportarImagenPage /></RutaAdmin>} />
          <Route path="/admin/kits"            element={<RutaAdmin><KitsPage /></RutaAdmin>} />
          <Route path="/admin/pedidos"         element={<RutaAdmin><GestionPedidosPage /></RutaAdmin>} />
          <Route path="/admin/reporte-ventas"  element={<RutaAdmin><ReporteVentasPage /></RutaAdmin>} />

          {/* Vendedor */}
          <Route path="/vendedor/pedidos" element={<RutaVendedor><VendedorPedidosPage /></RutaVendedor>} />
          <Route path="/vendedor/cupones" element={<RutaVendedor><CuponesVendedorPage /></RutaVendedor>} />

          {/* Cliente */}
          <Route path="/catalogo"          element={<RutaCliente><CatalogoPage /></RutaCliente>} />
          <Route path="/carrito"           element={<RutaCliente><CarritoPage /></RutaCliente>} />
          <Route path="/confirmar-pedido"  element={<RutaCliente><ConfirmarPedidoPage /></RutaCliente>} />
          <Route path="/direccion-envio"   element={<RutaCliente><DireccionEnvioPage /></RutaCliente>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </ClienteProvider>
  );
}