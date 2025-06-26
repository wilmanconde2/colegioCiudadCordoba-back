import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import path from 'node:path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const MONGO_OPTIONS = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
};

const alumnoSchema = new mongoose.Schema(
  {
    apellido1: { type: String, lowercase: true, trim: true, index: true },
    apellido2: { type: String, lowercase: true, trim: true, index: true },
    nombre1: { type: String, lowercase: true, trim: true, index: true },
    nombre2: { type: String, lowercase: true, trim: true },
    codigo: { type: String, trim: true },
    nombre_completo: { type: String, lowercase: true, trim: true },
  },
  { strict: false, timestamps: true },
);

const Alumno = mongoose.model('Alumno', alumnoSchema);

async function importarExcelAMongo() {
  try {
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI, MONGO_OPTIONS);
    console.log('✅ Conectado a MongoDB');

    // 🗑️ Eliminar índice único conflictivo si existe
    try {
      await Alumno.collection.dropIndex('unique_nombre_simple');
      console.log('🗑️ Índice único "unique_nombre_simple" eliminado.');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('ℹ️ El índice "unique_nombre_simple" no existe. Continuando...');
      } else {
        throw err;
      }
    }

    await Alumno.createIndexes();
    console.log('🔍 Índices creados');

    const filePath = path.resolve('public', 'alumnos.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const headers = worksheet
      .getRow(1)
      .values.map((h) => (h ? h.toString().trim().toLowerCase() : ''));

    const alumnos = [];
    const nombreSet = new Set();
    const duplicados = [];
    const batchSize = 1000;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData = row.values.map((val) => (val ? val.toString().trim().toLowerCase() : ''));

      const alumno = {};
      headers.forEach((header, index) => {
        if (header) alumno[header] = rowData[index];
      });

      const key = `${alumno.apellido1}|${alumno.apellido2}|${alumno.nombre1}|${alumno.nombre2}`;
      if (!nombreSet.has(key)) {
        nombreSet.add(key);
        alumnos.push(alumno);
      } else {
        duplicados.push(alumno);
      }
    });

    console.log('⏳ Eliminando registros antiguos...');
    await Alumno.deleteMany({});

    console.log('⏳ Insertando nuevos registros...');
    for (let i = 0; i < alumnos.length; i += batchSize) {
      const batch = alumnos.slice(i, i + batchSize);
      await Alumno.insertMany(batch, { ordered: false });
    }

    console.log(`✅ Base de datos actualizada correctamente.`);
    console.log(`📦 Total importados: ${alumnos.length}`);
    console.log(`🧹 Total duplicados filtrados: ${duplicados.length}`);

    if (duplicados.length > 0) {
      console.log(`📝 Lista de duplicados:`);
      duplicados.forEach((alumno, index) => {
        console.log(
          `${index + 1}. ${alumno.apellido1} ${alumno.apellido2} ${alumno.nombre1} ${
            alumno.nombre2 || ''
          } - código: ${alumno.codigo || 'sin código'}`,
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar la base de datos:', error.message);
    process.exit(1);
  }
}

importarExcelAMongo();
