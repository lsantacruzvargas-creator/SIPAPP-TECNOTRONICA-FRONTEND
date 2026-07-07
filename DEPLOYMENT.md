# Despliegue — Frontend SIPAPP-TECNOTRONICA

---

## Opción A — Aplicación de escritorio (Electron)

Genera un instalador `.exe` para Windows con el frontend ya empaquetado. El backend debe estar accesible en red.

### Requisitos

- Node.js 18+
- `npm install` ejecutado en `Frontend/`
- Ícono en `Frontend/public/icon.ico`

### Pasos

```bash
cd Frontend

# Compilar el frontend
npm run build

# Empaquetar con electron-builder
npm run electron:build
```

El instalador queda en `Frontend/dist-electron/`.

**appId:** `com.tecnotronica.sipapp`  
**Nombre del producto:** SIP App Tecnotronica

> La app limpia `localStorage` al cerrarse, por lo que el usuario debe iniciar sesión cada vez que abre la aplicación.

### Releases con auto-update

```bash
# Incremento de parche (4.1.1 → 4.1.2)
npm run release:patch

# Incremento de versión menor (4.1.x → 4.2.0)
npm run release:minor

# Incremento de versión mayor (4.x.x → 5.0.0)
npm run release:major
```

Estos comandos incrementan la versión en `package.json`, compilan y publican el instalador vía `electron-builder --publish always`.

---

## Opción B — Aplicación web (Vite build + servidor estático)

```bash
cd Frontend

# Definir la URL del backend en producción
echo "VITE_API_URL=https://tu-servidor.com/api" > .env.production

# Compilar
npm run build
# Archivos generados en Frontend/dist/
```

Servir `dist/` con cualquier servidor estático (Nginx, Apache, Vercel, etc.).

### Ejemplo con Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    root /var/www/sipapp-tecnotronica/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Checklist de despliegue

- [ ] `npm install` ejecutado en `Frontend/`
- [ ] `Frontend/.env` o `.env.production` con `VITE_API_URL` correcto
- [ ] Backend corriendo y accesible desde el cliente
- [ ] `npm run build` completado sin errores
- [ ] Para Electron: `public/icon.ico` presente
