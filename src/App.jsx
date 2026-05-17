import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClienteProvider, useCliente } from './context/ClienteContext';

// Shared
import Navbar from './components/shared/Navbar';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import ProductosPage from './pages/admin/ProductosPage';
import CrearProductoPage from './pages/admin/CrearProductoPage';
import BajaProductoPage from './pages/admin/BajaProductoPage';
import ImportarImagenPage from './pages/admin/ImportarImagenPage';
import KitsPage from './pages/admin/KitsPage';
import GestionPedidosPage from './pages/admin/GestionPedidosPage';

// Cliente pages
import RegistroPage from './pages/cliente/RegistroPage';
import CarritoPage from './pages/cliente/CarritoPage';
import ConfirmarPedidoPage from './pages/cliente/ConfirmarPedidoPage';
import DireccionEnvioPage from './pages/cliente/DireccionEnvioPage';
import CatalogoPage from './pages/cliente/CatalogoPage';

function RutaAdmin({ children }) {
  const { isLoggedIn, isAdmin } = useCliente();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/catalogo" replace />;
  return children;
}

function RutaCliente({ children }) {
  const { isLoggedIn, isCliente } = useCliente();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isCliente) return <Navigate to="/admin/productos" replace />;
  return children;
}

function RutaPublica({ children }) {
  const { isLoggedIn, isAdmin } = useCliente();
  if (isLoggedIn) return <Navigate to={isAdmin ? '/admin/productos' : '/catalogo'} replace />;
  return children;
}

export default function App() {
  return (
    <ClienteProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<RutaPublica><LoginPage /></RutaPublica>} />
          <Route path="/registro" element={<RutaPublica><RegistroPage /></RutaPublica>} />

          {/* Admin */}
          <Route path="/admin/productos"       element={<RutaAdmin><ProductosPage /></RutaAdmin>} />
          <Route path="/admin/crear-producto"  element={<RutaAdmin><CrearProductoPage /></RutaAdmin>} />
          <Route path="/admin/baja-producto"   element={<RutaAdmin><BajaProductoPage /></RutaAdmin>} />
          <Route path="/admin/importar-imagen" element={<RutaAdmin><ImportarImagenPage /></RutaAdmin>} />
          <Route path="/admin/kits"            element={<RutaAdmin><KitsPage /></RutaAdmin>} />
          <Route path="/admin/pedidos"         element={<RutaAdmin><GestionPedidosPage /></RutaAdmin>} />

          {/* Cliente */}
          <Route path="/catalogo" element={<RutaCliente><CatalogoPage /></RutaCliente>} />
          <Route path="/carrito"          element={<RutaCliente><CarritoPage /></RutaCliente>} />
          <Route path="/confirmar-pedido" element={<RutaCliente><ConfirmarPedidoPage /></RutaCliente>} />
          <Route path="/direccion-envio"  element={<RutaCliente><DireccionEnvioPage /></RutaCliente>} />
          

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ClienteProvider>
  );
}