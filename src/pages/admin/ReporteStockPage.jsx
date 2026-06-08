import { useEffect, useState } from "react";

export default function ReporteStockPage() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch("http://localhost:8080/api/productos/stock-critico", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setProductos(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error:", error);
                setError("Error al cargar el reporte");
                setLoading(false);
            });
    }, []);

    if (loading) return <p style={{ padding: 20 }}>Cargando reporte...</p>;
    if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>Reporte Stock Mínimo</h1>
            {productos.length === 0 ? (
                <p>No hay productos con stock crítico.</p>
            ) : (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Marca</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                            <th>Vendidos últimos 3 meses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => (
                            <tr key={producto.id}>
                                <td>{producto.id}</td>
                                <td>{producto.nombre}</td>
                                <td>{producto.marca}</td>
                                <td>{producto.stockActual}</td>
                                <td>{producto.stockMinimo}</td>
                                <td>{producto.vendidosUltimos3Meses}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <p style={{ marginTop: 16, fontSize: 12, color: "gray" }}>
                Al cargar esta página se genera automáticamente un email al administrador con sugerencias de reposición.
            </p>
        </div>
    );
}