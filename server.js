import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import compression from 'compression';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2222;

// Configuración optimizada de MongoDB
const MONGO_OPTIONS = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
};

// Middlewares 
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(compression()); 

// Esquema optimizado con índices
const alumnoSchema = new mongoose.Schema(
  {
    apellido1: { type: String, lowercase: true, trim: true, index: true },
    apellido2: { type: String, lowercase: true, trim: true, index: true },
    nombre1: { type: String, lowercase: true, trim: true, index: true },
    codigo: { type: String, index: true },
  },
  { strict: false, timestamps: true },
);

const Alumno = mongoose.model('Alumno', alumnoSchema);

// Conexión optimizada a MongoDB
mongoose
  .connect(process.env.MONGO_URI, MONGO_OPTIONS)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    // Crear índices después de conectar
    Alumno.createIndexes()
      .then(() => console.log('🔍 Índices creados/verificados'))
      .catch((err) => console.error('⚠️ Error creando índices:', err.message));
  })
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });

// Función keep-alive
function startKeepAlive() {
  const url = process.env.RENDER_URL || `http://localhost:${PORT}`;

  const pingServer = async () => {
    try {
      await axios.get(url);
      console.log(`🔄 Keep-alive ping a ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('⚠️ Error en keep-alive:', error.message);
    }
  };

  // Ejecutar inmediatamente y luego cada 5 minutos
  pingServer();
  setInterval(pingServer, 9 * 60 * 1000);
}

// Iniciar keep-alive si está en producción
if (process.env.NODE_ENV === 'production') {
  startKeepAlive();
}

// Ruta de prueba optimizada
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Servidor funcionando correctamente 🚀',
    timestamp: new Date(),
  });
});

// Buscar código optimizado
app.post('/buscar-codigo', async (req, res) => {
  console.log('🔍 Petición recibida:', req.body);
  const { apellido1, apellido2, nombre1 } = req.body;

  // Validación de entrada
  if (!apellido1 || !apellido2 || !nombre1) {
    return res.status(400).json({
      status: 'fail',
      error: 'Datos incompletos',
      required: ['apellido1', 'apellido2', 'nombre1'],
    });
  }

  try {
    const query = {
      apellido1: apellido1.trim().toLowerCase(),
      apellido2: apellido2.trim().toLowerCase(),
      nombre1: nombre1.trim().toLowerCase(),
    };

    const alumno = await Alumno.findOne(query)
      .select('codigo')
      .lean() 
      .maxTimeMS(5000); // Timeout de 5 segundos

    if (!alumno) {
      return res.status(404).json({
        status: 'fail',
        error: 'Estudiante no encontrado',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { codigo: alumno.codigo },
    });
  } catch (error) {
    console.error('❌ Error al buscar:', error);
    res.status(500).json({
      status: 'error',
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('🔥 Error no manejado:', err);
  res.status(500).json({
    status: 'error',
    error: 'Error interno del servidor',
  });
});

// Iniciar servidor optimizado
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibido SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('🔴 Servidor cerrado');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
