# SIPAPP-TECNOTRONICA — Frontend

Interfaz de usuario del sistema de gestión interno de **Tecnotronica**. Construida con React + Vite y empaquetada como aplicación de escritorio con Electron.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework UI | React 19 |
| Build tool | Vite |
| Estilos | Tailwind CSS 4 |
| Routing | React Router DOM (HashRouter) |
| PDF | jsPDF + jsPDF-AutoTable |
| Excel | SheetJS (xlsx) |
| Gráficas | Recharts |
| Documentos Word | docx |
| Escritorio | Electron + electron-updater |

---

## Requisitos previos

- Node.js 18+
- Backend corriendo en `http://localhost:5000`

---

## Variables de entorno

Crear `Frontend/.env` para desarrollo web:

```env
VITE_API_URL=http://localhost:5000/api
```

> En modo Electron la URL del backend se define en `electron/main.cjs` y no requiere `.env`.

---

## Instalación

```bash
cd Frontend
npm install
```

---

## Comandos de desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor Vite en `http://localhost:5173` |
| `npm run electron:dev` | Inicia Vite + abre la ventana Electron |
| `npm run build` | Compila el frontend para producción (`dist/`) |
| `npm run electron:build` | Compila y empaqueta el instalador Electron (`dist-electron/`) |
| `npm run preview` | Previsualiza el build de producción |

---

## Estructura del proyecto

```
src/
├── components/          # Modales, Navbar, ProtectedRoute, etc.
├── pages/               # Una página por módulo
│   ├── Dashboard.jsx
│   ├── Cotizaciones.jsx
│   ├── ListaCotizaciones.jsx
│   ├── IngresoEquipos.jsx
│   ├── ListaOrdenesTrabajo.jsx
│   ├── ListaFacturas.jsx
│   ├── ListaOrdenesCompra.jsx
│   ├── Empresas.jsx
│   └── Usuarios.jsx
└── utils/
    ├── fetchAuth.js         # Wrapper de fetch con JWT
    ├── cotizacionPdf.js     # Generación de PDF de cotizaciones
    └── cotizacionItems.js   # Clases CSS compartidas
electron/
└── main.cjs               # Proceso principal de Electron
public/
└── icon.ico               # Ícono de la aplicación
```

---

## Autenticación

El token JWT se almacena en `localStorage` bajo la clave `token`. Todas las peticiones al backend se realizan a través de `fetchAuth`, que agrega automáticamente el header `Authorization: Bearer <token>`.

---

## Licencia

Copyright (c) 2025 Tecnotronica. Todos los derechos reservados.
