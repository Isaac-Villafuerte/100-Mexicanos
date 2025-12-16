# Deploy a cPanel con Passenger

## Pasos

### 1. Build del frontend
```bash
cd frontend
pnpm run build
```

### 2. Copiar dist a backend/public
```bash
cp -r frontend/dist backend/public
```

### 3. Configurar .env en backend
Asegúrate de tener el `.env` con las variables correctas:
```
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=100mexicanos
OPENAI_API_KEY=sk-...
```

### 4. Subir backend a hosting
- Comprime la carpeta `backend/`
- Sube y descomprime en tu hosting

### 5. Instalar dependencias
```bash
cd backend
npm install --production
```

### 6. Configurar Passenger en cPanel
- Application root: `/home/tu_usuario/tu_app/backend`
- Application URL: `/` o tu dominio
- Application startup file: `app.js`

## Estructura final
```
backend/
├── app.js          ← Entry point Passenger
├── public/         ← Frontend build (copiar de dist)
│   ├── index.html
│   └── assets/
├── src/
├── package.json
└── .env
```
