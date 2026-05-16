import { createContext, useContext, useState } from 'react';

const ClienteContext = createContext(null);

export function ClienteProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const clienteId = localStorage.getItem('clienteId');
    const nombre = localStorage.getItem('nombre');
    if (token && rol) return { token, rol, clienteId, nombre };
    return null;
  });

  const login = ({ token, rol, id, nombre }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('clienteId', String(id));
    localStorage.setItem('nombre', nombre);
    setAuth({ token, rol, clienteId: String(id), nombre });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('clienteId');
    localStorage.removeItem('nombre');
    setAuth(null);
  };

  return (
    <ClienteContext.Provider value={{
      auth,
      login,
      logout,
      clienteId: auth?.clienteId || null,
      rol: auth?.rol || null,
      token: auth?.token || null,
      nombre: auth?.nombre || null,
      isLoggedIn: !!auth,
      isAdmin: auth?.rol === 'ADMIN' || auth?.rol === 'VENDEDOR',
      isCliente: auth?.rol === 'CLIENTE',
    }}>
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  return useContext(ClienteContext);
}