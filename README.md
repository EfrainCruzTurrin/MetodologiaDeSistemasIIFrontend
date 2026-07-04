E-Commerce Body Painting — Frontend

Frontend de la plataforma de e-commerce de insumos de body painting, desarrollado como parte del Trabajo Práctico Integrador para Metodología de Sistemas II (UTN FRVM). Consume la API del backend.

Funcionalidades


Catálogo de productos y kits, con vista de stock actualizado.
Aplicación de cupones de descuento en el checkout.
Flujo de compra y confirmación de pedido.
Panel de vendedor para gestión de pedidos.
Autenticación de usuarios contra la API vía JWT.


Stack tecnológico


React 18
React Router 6
Vite 5


Cómo levantar el proyecto localmente

Prerrequisitos


Node.js (versión LTS recomendada)
El backend corriendo localmente


Pasos

bashgit clone https://github.com/EfrainCruzTurrin/MetodologiaDeSistemasIIFrontend.git
cd MetodologiaDeSistemasIIFrontend
npm install
cp .env.example .env   # completar con la URL de la API
npm run dev

La aplicación queda disponible en http://localhost:5173.

Equipo

Proyecto desarrollado en equipo (Grupo 4) para la materia Metodología de Sistemas II, Tecnicatura Universitaria en Programación — UTN Facultad Regional Villa María.
