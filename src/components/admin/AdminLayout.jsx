export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 52px)' }}>
      {children}
    </div>
  );
}
