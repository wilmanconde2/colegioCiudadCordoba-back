import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2222;

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });

const alumnoSchema = new mongoose.Schema({}, { strict: false });
const Alumno = mongoose.model('Alumno', alumnoSchema);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

// Buscar código desde MongoDB
app.post('/buscar-codigo', async (req, res) => {
  console.log('🔍 Petición recibida:', req.body);
  const { apellido1, apellido2, nombre1 } = req.body;

  try {
    const alumno = await Alumno.findOne({
      apellido1: apellido1.trim().toLowerCase(),
      apellido2: apellido2.trim().toLowerCase(),
      nombre1: nombre1.trim().toLowerCase(),
    });

    if (alumno) {
      return res.status(200).json({ codigo: alumno.codigo });
    } else {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    console.error('❌ Error al buscar:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
