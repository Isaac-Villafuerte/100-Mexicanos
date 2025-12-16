# 100 Mexicanos Dijeron - Plataforma Web

Plataforma web para jugar "100 Mexicanos Dijeron" (Family Feud) con tu familia.

## 🎮 Características

- **Pantalla principal de juego**: Visualización en tiempo real del tablero
- **Pantalla de presentador**: Control total del juego
- **Panel de administración**: Gestión de preguntas, categorías y configuración
- **Tiempo real**: Sincronización instantánea con Socket.IO
- **IA integrada**: Importación de preguntas desde imágenes y sugerencias automáticas

## 🏗️ Estructura del proyecto

```
100MexicanosDijeron/
├── backend/          # Node.js + Express + Socket.IO + MySQL
└── frontend/         # React + Vite + SASS
```

## 🚀 Inicio rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📋 Requisitos previos

- Node.js 18+
- MySQL 8+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🎯 Roadmap

- [x] Estructura base del proyecto
- [ ] Backend: Express + Socket.IO
- [ ] Modelo de dominio
- [ ] API de administración
- [ ] Lógica de juego
- [ ] Frontend: React + rutas
- [ ] Pantallas de juego
- [ ] Diseño y sonidos

## 📝 Licencia

MIT
