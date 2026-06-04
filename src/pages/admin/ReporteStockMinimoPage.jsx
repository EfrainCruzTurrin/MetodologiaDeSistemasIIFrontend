import { useEffect, useState } from "react";
import { obtenerReporteStock } from "../../api/api";

function ReporteStockMinimoPage() {

    const [productos, setProductos] = useState([]);

    useEffect(() => {

        cargarReporte();

    }, []);

    async function cargarReporte() {

        const data = await obtenerReporteStock(20);

        setProductos(data);
    }

    return (
        <div>

            <h1>Reporte Stock Mínimo</h1>

            <table border="1">

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

export default ReporteStockMinimoPage;