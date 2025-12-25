// ***** Manage Logs in a file ******

import fs from 'fs';
import p from 'path';
import { fileURLToPath } from 'url';
import { subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = p.dirname(__filename);

// Ajusta la contraseña que quieras pedir:
const LOGS_PASSWORD = process.env.LOGGER_PASSWORD || "xido@admin";
// Para "recordar" quién está autenticado
// (se guardan tokens en memoria - cada reinicio se vacía):
const authorizedTokens = new Set();

const logsPath = "/logs";
const logsDirectory = p.join(__dirname, logsPath);
const timeZone = "America/Mexico_City";

// Función para garantizar que el directorio de logs existe
function ensureLogDirectoryExists(year, month, day, create=true) {
  const dir = p.join(logsDirectory, year, month, day);
  if (!fs.existsSync(dir) && create) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Normalizar el año, mes y día a formatos de 4 dígitos y 2 dígitos
// Para procesar AAAA o AA, MM o M, DD o D
function normalizeDate(value, length) {
  if (!value) return null;
  if (length === 4 && value.length === 2) return `20${value}`;
  return value.padStart(length, '0').slice(-length);
}

// Obtener el año, mes y día actual o proporcionado considerando zona horaria
function getYearMonthDayDateToday(y, m, d, fromDate=new Date()) {
  const now = fromDate;
  const year = normalizeDate(y, 4) || formatInTimeZone(now, timeZone, "yyyy");
  const month = normalizeDate(m, 2) || formatInTimeZone(now, timeZone, "MM");
  const day = normalizeDate(d, 2) || formatInTimeZone(now, timeZone, "dd");
  const date = new Date(formatInTimeZone(`${year}-${month}-${day}T00:00:00`, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  const today = new Date(formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"))
  return { year, month, day, date, today };
}

// Obtener el nombre del archivo de log
function getLogFileName(y, m, d, createDir=false) {
  const { year, month, day } = getYearMonthDayDateToday(y, m, d);
  const logDir = ensureLogDirectoryExists(year, month, day, createDir);
  return p.join(logDir, `log-${year}-${month}-${day}.log`);
}

// Obtener el nombre del archivo de error
function getErrorFileName(y, m, d, createDir=false) {
  const { year, month, day } = getYearMonthDayDateToday(y, m, d);
  const logDir = ensureLogDirectoryExists(year, month, day, createDir);
  return p.join(logDir, `error-${year}-${month}-${day}.log`);
}

// Función para obtener el contenido del archivo solicitado
// function sendLogFile(res, fileName) {
//   if (!fs.existsSync(fileName)) {
//     res.send("Archivo de logs vacío o no existente");
//     return;
//   }
//   res.sendFile(fileName);
// }

// # Manejo de Historial de Logs

// Función para obtener y concatenar logs de varios días
function getLogsForHistory(y, m, d, h, type) {
  const { date } = getYearMonthDayDateToday(y, m, d);

  const files = [];
  const daysToFetch = parseInt(h) || 1;

  for (let i = 0; i < daysToFetch; i++) {
    const subDate = subDays(date, i);
    const { year, month, day } = getYearMonthDayDateToday(null, null, null, subDate);

    const filePath =
      type === "log"
        ? getLogFileName(year, month, day)
        : getErrorFileName(year, month, day);

    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }

  return files.reverse();
}

// Función para enviar los logs concatenados
function sendConcatenatedLogs(res, files) {
  // Obtener fechas desde los nombres de archivo
  const dates = files.map((file) => {
    const match = file.match(/(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[0] : null;
  }).filter(Boolean);
  const startDate = dates[dates.length - 1];
  const endDate = dates[0];
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.write(`
    <html>
      <head>
        <title>Logs</title>
        <style>
          body { background: #000; color: #fff; }
          header { position: fixed; top: 0; left: 0; width: 100%; background: #000; margin: 0; }
          h1 { margin: 0; padding: 0.5em; }
          span { font-size: 0.75em; }
          .buttons { position: fixed; bottom: 1em; right: 1em; z-index: 1000; }
          button { background: #444; color: #fff; border: none; padding: 0.5em 1em; margin: 0.5em; cursor: pointer; border-radius: 0.5em; } 
          button:hover { background: #666; }
          pre { white-space: pre-wrap; word-wrap: break-word; padding: 0 1em; margin-top: 8em; }
        </style>
      </head>
      <body>
        <header><h1>Logs <span>${endDate} a ${startDate}</span></h1></header>
        <pre>`);

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    res.write(content);
  });
  res.write(`\n\n\n\n\n\n\n\n\n\n\n\n`);

  res.write(`
      </pre>
      <div class="buttons">
        <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">Ir al inicio</button>
        <button onclick="window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })">Ir al final</button>
      </div>
      </body>
      <script>
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 150);
      </script>
    </html>`);
  res.end();
}

// * ///////////////////////////////////////////////////////////////////////
// # Funciones de soporte para manejar la autenticación sencilla SIN dependencias
// * ///////////////////////////////////////////////////////////////////////
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((item) => {
    const parts = item.split("=");
    const key = parts[0].trim();
    const value = parts[1] ? parts[1].trim() : "";
    cookies[key] = value;
  });
  return cookies;
}

// Parsear el body en caso de que venga un formulario (POST)
function parseFormData(req) {
  return new Promise((resolve) => {
    if (req.method !== "POST") {
      return resolve({});
    }
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      const params = new URLSearchParams(data);
      resolve(Object.fromEntries(params));
    });
    req.on("error", () => resolve({}));
  });
}

// Generar un token pseudoaleatorio
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware que protege las rutas de logs/errores, etc.
async function checkLogsAuth(req, res, next) {
  // console.log("checkLogsAuth",req.url, req.originalUrl);
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.token;

  // Si el token es válido, continuamos
  if (token && authorizedTokens.has(token)) {
    return next();
  }

  // Si no hay token válido, revisamos si es un POST con la contraseña
  if (req.method === "POST") {
    const form = await parseFormData(req);
    const password = form.password || "";

    if (password === LOGS_PASSWORD) {
      // Contraseña correcta: generamos un token, lo guardamos y lo seteamos en cookie
      const newToken = generateToken();
      authorizedTokens.add(newToken);

      // Establecer la cookie
      res.setHeader("Set-Cookie", `token=${newToken}; HttpOnly`);

      // Redirigir a la misma URL
      res.statusCode = 302;
      res.setHeader("Location", req.originalUrl);
      return res.end();
    }

    // Contraseña incorrecta
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // console.log("Contraseña incorrecta",req.url, req.originalUrl);
    return res.end(`
      <body style="background: #000; color: #fff; padding: 1rem; min-height: 100vh; min-width: 100vw;">
        <h2 style="color:white;background:black;padding:1rem;">Contraseña incorrecta</h2>
        <a style="color:aqua" href="${req.originalUrl}">Reintentar</a>
      </body>
    `);
  }

  // Si es GET y no tenemos token, mostrar formulario
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.end(`
  <html>
    <head><title>Logger</title></head>
    <body style="background:#000; color:#fff; font-family: sans-serif; padding:1rem;">
      <h1>Se requiere contraseña para acceder</h1>
      <form method="POST">
        <label for="password">Contraseña:</label>
        <input type="password" id="password" name="password" />
        <button type="submit">Entrar</button>
      </form>
    </body>
  </html>
  `);
}

// * ///////////////////////////////////////////////////////////////////////

// Rutas para obtener logs y errores
function setLogsRoute(app) {
  // Proteger rutas de logs:
  // (Puedes ajustar las rutas exactas si quieres, incluidas las SSE o no)
  app.use(["/logs", "/errors", "/livelog", "/liveerror", "/live", "/stream/log", "/stream/error"], checkLogsAuth);

  app.get("/logs", (req, res) => {
    const { y, m, d, h } = req.query;
    const logFiles = getLogsForHistory(y, m, d, h, "log");
    if (logFiles.length === 0) {
      res.send("No hay archivos de logs disponibles para el rango especificado.");
      return;
    }
    sendConcatenatedLogs(res, logFiles);
  });

  app.get("/errors", (req, res) => {
    const { y, m, d, h } = req.query;
    const errorFiles = getLogsForHistory(y, m, d, h, "error");
    if (errorFiles.length === 0) {
      res.send("No hay archivos de errores disponibles para el rango especificado.");
      return;
    }
    sendConcatenatedLogs(res, errorFiles);
  });

  

  const htmlLive = (stream='log') => `
      <html>
        <head>
          <title>${stream.trim()} en tiempo real</title>
          <style>
            body { background: #000; color: #fff; }
            h1 { position: fixed; top: 0; left: 0; width: 100%; background: #000; margin: 0; padding: 0.5em; }
            pre { white-space: pre-wrap; word-wrap: break-word; margin-top: 8em; }
            .buttons { position: fixed; bottom: 1em; right: 1em; z-index: 1000; }
            button { background: #444; color: #fff; border: none; padding: 0.5em 1em; margin: 0.5em; cursor: pointer; border-radius: 0.5em; }
            button:hover { background: #666; }
          </style>
        </head>
        <body>
          <h1>Log en tiempo real</h1>
          <pre id="log"></pre>
          <div class="buttons">
            <button onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">Ir al inicio</button>
            <button onclick="window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })">Ir al final</button>
          </div>
          <script>
            const logElement = document.getElementById('log');
            const eventSource = new EventSource('/stream/${stream.trim()}');

            let shouldAutoScroll = true;

            // Detectar el scroll del usuario
            window.addEventListener('scroll', () => {
              const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 50;
              shouldAutoScroll = nearBottom;
            });

            // Recibir mensajes del servidor
            eventSource.onmessage = (e) => {
              logElement.textContent += e.data + '\\n';
              if (shouldAutoScroll) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }
            };
          </script>
        </body>
      </html>
    `

  // Ruta para ver logs en tiempo real
  app.get(["/livelog","/live"], (req, res) => {
    const logsFile = getLogFileName();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.write(htmlLive('log'));
  });

  // Ruta para ver errores en tiempo real
  app.get("/liveerror", (req, res) => {
    const errorFile = getErrorFileName();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.write(htmlLive('error'));
  });

  // Rutas para transmitir logs en tiempo real con Server-Sent Events (SSE)
  app.get("/stream/log", (req, res) => {
    const logsFile = getLogFileName();
    streamLogs(req, res, logsFile);
  });

  app.get("/stream/error", (req, res) => {
    const errorFile = getErrorFileName();
    streamLogs(req, res, errorFile);
  });
}

// Función para transmitir logs en tiempo real
function streamLogs(req, res, file) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Enviar el contenido inicial completo si el archivo existe
  if (fs.existsSync(file)) {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        console.error("Error al leer el archivo:", err);
        res.write(`data: Error al leer el archivo\n\n`);
        return;
      }
      // Enviar el contenido completo del archivo
      res.write(`data: ${data.trimEnd().replace(/\n/g, '\ndata: ')}\n\n`);
    });
  } else {
    res.write(`data: El archivo no existe\n\n`);
  }

  // Observar el archivo para nuevas líneas
  let lastSize = fs.existsSync(file) ? fs.statSync(file).size : 0;

  const watcher = fs.watch(file, (eventType) => {
    if (eventType === "change") {
      const newSize = fs.statSync(file).size;

      if (newSize > lastSize) {
        const readStream = fs.createReadStream(file, {
          encoding: "utf8",
          start: lastSize,
          end: newSize,
        });

        readStream.on("data", (chunk) => {
          res.write(`data: ${chunk.trimEnd().replace(/\n/g, '\ndata: ')}\n\n`);
        });

        lastSize = newSize;
      }
    }
  });

  // Limpiar el watcher cuando el cliente cierra la conexión
  req.on("close", () => {
    watcher.close();
    res.end();
  });
}

// # Capturando logs y errores en archivos

// Serializa cualquier argumento para que los objetos Error se registren
function serialize(arg) {
  if (arg instanceof Error) {
    // Incluimos nombre, mensaje y stack completo
    return `${arg.name}: ${arg.message}\n${arg.stack}`;
  }
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      // Si hay referencias circulares o no se puede serializar
      return String(arg);
    }
  }
  return String(arg);
}

function logMessage(message) {
  const now = new Date();
  const logFileName = getLogFileName(null, null, null, true);
  const logMessage = `${formatInTimeZone(now, timeZone, "yyyy.MM.dd HH:mm:ss")} - ${message}\n`;

  fs.appendFile(logFileName, logMessage, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de logs:", err);
    }
  });
}

function logError(error) {
  const now = new Date();
  const errorFileName = getErrorFileName(null, null, null, true);
  const logFileName = getLogFileName(null, null, null, true);
  const errorMessage = `${formatInTimeZone(now, timeZone, "yyyy.MM.dd HH:mm:ss")} - (logger) ERROR:
  ***************************** console ERROR *****************************\n  ${error}\n\n`;
  fs.appendFile(errorFileName, errorMessage, (error) => {
    if (error) {
      console.error("Error al escribir en el archivo de logs:", error);
    }
  });
  fs.appendFile(logFileName, errorMessage, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de logs:", err);
    }
  });
}

// Capturar console.log
const originalConsoleLog = console.log;
  console.log = (...args) => {
    // const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ");
    const message = args.map(serialize).join(" ");
    logMessage(message);
    originalConsoleLog.apply(console, args);
  };

// Capturar console.error
const originalConsoleError = console.error;
console.error = (...args) => {
  // const message = args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ");
  const message = args.map(serialize).join(" ");
  logError(message);
  originalConsoleError.apply(console, args);
};

// Manejar errores no capturados y registrarlos en un archivo
process.on("uncaughtException", (err) => {
  console.log("Error no capturado:", err);
  const now = new Date();
  const logFileName = getLogFileName(null, null, null, true);
  const errorFileName = getErrorFileName(null, null, null, true);
  const errorMessage = `${formatInTimeZone(now, timeZone, "yyyy.MM.dd HH:mm:ss")} - (uncaughtException) EN SERVER - ERROR: ${err}
  ******************************* ERROR **********************************\n  ${err.stack}\n\n`;
  fs.appendFile(errorFileName, errorMessage, (error) => {
    if (error) {
      console.error("Error al escribir en el archivo de logs:", error);
    }
  });
  fs.appendFile(logFileName, errorMessage, (err) => {
    if (err) {
      console.log("Error al escribir en el archivo de logs:", err);
    }
  });
});

// Manejar promesas no capturadas
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  const now = new Date();
  const errorFileName = getErrorFileName(null, null, null, true);
  const logFileName = getLogFileName(null, null, null, true);
  const errorMessage = `${formatInTimeZone(now, timeZone, "yyyy.MM.dd HH:mm:ss")} - (Unhandled Rejection) ERROR NO MANEJADO:
  ******************************* ERROR **********************************
  reason: ${reason} \n  info:${reason instanceof Error ? reason.stack : JSON.stringify(reason)}\n\n`
  fs.appendFile(errorFileName, errorMessage, (error) => {
    if (error) {
      console.error("Error al escribir en el archivo de logs:", error);
    }
  });
  fs.appendFile(logFileName, errorMessage, (error) => {
    if (error) {
      console.error("Error al escribir en el archivo de logs:", error);
    }
  });
});

// Exportar funciones

const logger = (app) => {
  if(!app) {
    return console.error('logger, no puede ser configurado, requiere el servidor: "logger(app)"');
  }
  setLogsRoute(app);
}

export default logger;