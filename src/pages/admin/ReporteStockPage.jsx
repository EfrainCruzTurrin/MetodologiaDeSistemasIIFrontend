import { useEffect, useState } from "react";

export default function ReporteStockPage() {

    const [productos, setProductos] = useState([]);

    useEffect(() => {

        fetch("http://localhost:8080/api/reportes/stock-minimo?porcentaje=20")
            .then((response) => response.json())
            .then((data) => {
                setProductos(data);
            })
            .catch((error) => {
                console.error("Error:", error);
            });

    }, []);

    return (
        <div style={{ padding: "20px" }}>

            <h1>Reporte Stock Mínimo</h1>

            <table border="1" cellPadding="10">

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                    </tr>
                </thead>

                <tbody>

                    {productos.map((producto) => (

                        <tr key={producto.id}>

                            <td>{producto.id}</td>
                            <td>{producto.nombre}</td>
                            <td>{producto.stockActual}</td>
                            <td>{producto.stockMinimo}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}