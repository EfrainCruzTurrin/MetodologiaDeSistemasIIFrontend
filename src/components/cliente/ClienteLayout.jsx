export default function ClienteLayout({ children }) {
  return (
    <div className="client-theme" style={{ minHeight: 'calc(100vh - 52px)' }}>
      {children}
    </div>
  );
}
