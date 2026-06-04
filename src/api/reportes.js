const URL = "http://localhost:8080/api/reportes";

export async function obtenerReporteStock(porcentaje) {

    const response = await fetch(
        `${URL}/stock-minimo?porcentaje=${porcentaje}`
    );

    return await response.json();
}