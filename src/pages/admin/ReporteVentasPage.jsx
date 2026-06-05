import { useState, useEffect } from 'react';
import { getReporteProductosMasVendidos } from '../../api/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function ReporteVentasPage() {

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const generarReporte = async () => {

    setLoading(true);
    setMensaje('');

    try {

      const data =
        await getReporteProductosMasVendidos(
          mes,
          anio
        );

      setReporte(data);

      if (data.length === 0) {
        setMensaje(
          'No existen ventas para el período seleccionado.'
        );
      }

    } catch (error) {

      setMensaje(
        'Error al generar el reporte.'
      );

      setReporte([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    generarReporte();
  }, []);

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i
              className="ti ti-chart-bar"
              style={{
                marginRight: 8,
                color: 'var(--accent)'
              }}
            />
            Reporte de Productos Más Vendidos
          </h1>

          <p className="page-subtitle">
            Consultá los productos con mayor cantidad de ventas.
          </p>
        </div>
      </div>

      {/* Filtros */}

      <div
        className="card"
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'end',
          marginBottom: 24
        }}
      >

        <div className="field">
          <label>Mes</label>

          <select
            value={mes}
            onChange={(e) =>
              setMes(Number(e.target.value))
            }
          >
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>
        </div>

        <div className="field">
          <label>Año</label>

          <input
            type="number"
            value={anio}
            onChange={(e) =>
              setAnio(Number(e.target.value))
            }
          />
        </div>

        <button
          className="btn btn-accent"
          onClick={generarReporte}
        >
          <i className="ti ti-search" />
          Generar Reporte
        </button>

      </div>

      {/* Loading */}

      {loading && (
        <LoadingSpinner
          message="Generando reporte..."
        />
      )}

      {/* Mensaje sin datos */}

      {!loading && mensaje && (
        <div className="card">
          <div
            className="empty-state"
            style={{ padding: 30 }}
          >
            <i className="ti ti-chart-bar-off" />
            <p>{mensaje}</p>
          </div>
        </div>
      )}

      {/* Estadística */}

      {!loading && reporte.length > 0 && (

        <>
          <div
            className="stats-bar"
            style={{ marginBottom: 20 }}
          >
            <div className="stat">
              <div className="stat-label">
                Productos vendidos
              </div>

              <div className="stat-value">
                {reporte.length}
              </div>
            </div>
          </div>

          {/* Tabla */}

          <div className="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Cantidad Vendida</th>
                </tr>
              </thead>

              <tbody>

                {reporte.map(
                  (producto, index) => (

                    <tr key={index}>

                      <td>
                        {index + 1}
                      </td>

                      <td
                        style={{
                          fontWeight: 600
                        }}
                      >
                        {producto.productoNombre}
                      </td>

                      <td>
                        <span
                          className="badge badge-accent"
                        >
                          {producto.cantidadVendida}
                        </span>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        </>
      )}

    </div>
  );
}