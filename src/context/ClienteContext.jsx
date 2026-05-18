import { createContext, useContext, useState } from 'react';

const ClienteContext = createContext(null);

export function ClienteProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const clienteId = localStorage.getItem('clienteId');
    const nombre = localStorage.getItem('nombre');
    const carritoId = localStorage.getItem('carritoId');
    if (token && rol) return { token, rol, clienteId, nombre, carritoId };
    return null;
  });

  const login = ({ token, rol, id, nombre, carritoId }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('clienteId', String(id));
    localStorage.setItem('nombre', nombre);
    localStorage.setItem('carritoId', String(carritoId));
    setAuth({ token, rol, clienteId: String(id), nombre, carritoId: String(carritoId) });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('clienteId');
    localStorage.removeItem('nombre');
    localStorage.removeItem('carritoId');
    setAuth(null);
  };

  return (
    <ClienteContext.Provider value={{
      auth,
      login,
      logout,
      clienteId: auth?.clienteId || null,
      carritoId: auth?.carritoId || null,
      rol: auth?.rol || null,
      token: auth?.token || null,
      nombre: auth?.nombre || null,
      isLoggedIn: !!auth,
      isAdmin:    auth?.rol === 'ADMIN',      // ← solo ADMIN
      isVendedor: auth?.rol === 'VENDEDOR',   // ← nuevo
      isCliente:  auth?.rol === 'CLIENTE',
    }}>
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  return useContext(ClienteContext);
}