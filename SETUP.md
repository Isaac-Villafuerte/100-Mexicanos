# Guía de Instalación - 100 Mexicanos Dijeron

## 📋 Requisitos Previos

- **Node.js** 18 o superior
- **MySQL** 8 o superior  
- **npm** o **yarn**

## 🗄️ Configuración de Base de Datos

### 1. Crear la base de datos

```bash
mysql -u root -p
```

```sql
CREATE DATABASE mexicanos_dijeron CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Importar el esquema

```bash
cd backend
mysql -u root -p mexicanos_dijeron < src/infrastructure/db/schema.sql
```

## 🔧 Configuración del Backend

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de MySQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=mexicanos_dijeron
NODE_ENV=development
```

### 3. Iniciar el servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🎨 Configuración del Frontend

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 🎮 Uso de la Aplicación

### Paso 1: Crear una partida

1. Ve a `http://localhost:5173`
2. Haz clic en **"Panel de Administración"**
3. En la pestaña **"Configurar Juego"**:
   - Ingresa el título del juego
   - Define el puntaje objetivo (ej: 300)
   - Nombra los equipos (Equipo A y Equipo B)
   - Haz clic en **"Crear Partida"**
4. Anota el **ID del juego** que se genera

### Paso 2: Configurar preguntas (opcional)

En el panel de administración:

#### Opción A: Crear preguntas manualmente
1. Ve a la pestaña **"Preguntas"**
2. Selecciona **"Manual"**
3. Elige una categoría
4. Escribe la pregunta
5. Agrega de 1 a 8 respuestas con sus puntajes
6. Haz clic en **"Guardar Pregunta"**

#### Opción B: Importar desde imagen (con IA)
1. Ve a **"Desde Imagen"**
2. Sube una imagen con el tablero de preguntas
3. La IA extraerá los datos (stub por ahora)
4. Revisa y confirma
5. Haz clic en **"Guardar Pregunta"**

#### Opción C: Sugerencias con IA
1. Ve a **"Sugerencias IA"**
2. Escribe una pregunta
3. La IA sugerirá respuestas populares (stub por ahora)
4. Revisa y guarda

### Paso 3: Iniciar el juego

1. **Pantalla de Presentador (Host):**
   - Ve a `http://localhost:5173/host/{GAME_ID}`
   - Usa esta pantalla para controlar el juego

2. **Pantalla del Tablero (Board):**
   - Abre en otra pestaña, pantalla o proyector: `http://localhost:5173/board/{GAME_ID}`
   - Esta es la vista que verán los jugadores

### Paso 4: Jugar

Desde la pantalla del presentador:

1. Haz clic en **"Siguiente Ronda (x1)"** para iniciar
2. Revela respuestas haciendo clic en **"Revelar"**
3. Marca strikes con el botón **"Strike"**
4. Cambia el equipo en turno si es necesario
5. Al final de la ronda, haz clic en **"Asignar Puntos"** al equipo ganador
6. Repite para las siguientes rondas

## 🎵 Agregar Sonidos (Opcional)

1. Descarga o crea archivos de audio:
   - `correct.mp3` - Respuesta correcta
   - `strike.mp3` - Strike
   - `round-end.mp3` - Fin de ronda
   - `game-start.mp3` - Inicio de juego

2. Colócalos en: `frontend/public/sounds/`

## 🧩 Integrar IA Real (Opcional)

Los servicios de IA son stubs. Para conectar con OpenAI:

### Backend - Image Question Extractor

Edita `backend/src/infrastructure/ai/imageQuestionExtractor.js`:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async extract(imagePath) {
  const imageUrl = `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString('base64')}`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { 
          type: "text", 
          text: "Extrae la pregunta y respuestas de esta imagen de Family Feud. Devuelve JSON con: {question, categoryName, answers: [{text, points}]}" 
        },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    }]
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### Backend - Answers Suggester

Edita `backend/src/infrastructure/ai/answersSuggester.js`:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async suggest(question, category) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Eres un experto en crear preguntas estilo Family Feud. Genera 5-8 respuestas populares con puntajes realistas (total: 100 puntos)."
    }, {
      role: "user",
      content: `Pregunta: ${question}\nCategoría: ${category || 'General'}\n\nDevuelve JSON: {answers: [{text, points}]}`
    }]
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

No olvides agregar `OPENAI_API_KEY` a tu `.env`

## 🐛 Solución de Problemas

### El backend no se conecta a MySQL
- Verifica que MySQL esté corriendo: `mysql.server status`
- Comprueba las credenciales en `.env`
- Asegúrate de que la base de datos existe

### El frontend no carga
- Verifica que el backend esté corriendo en el puerto 3000
- Revisa la consola del navegador por errores
- Confirma que las dependencias están instaladas: `npm install`

### Socket.IO no se conecta
- Verifica que ambos servidores (backend y frontend) estén corriendo
- Revisa la URL del socket en `frontend/src/hooks/useSocket.js`
- Comprueba que no haya firewalls bloqueando el puerto 3000

## 📚 Recursos Adicionales

- [Documentación de Socket.IO](https://socket.io/docs/)
- [React Router](https://reactrouter.com/)
- [MySQL2 Node.js](https://github.com/sidorares/node-mysql2)
- [Vite](https://vitejs.dev/)

## 🤝 Soporte

Para preguntas o problemas, revisa:
1. Los logs del servidor backend
2. La consola del navegador (F12)
3. El estado de la base de datos

¡Diviértete jugando! 🎉
