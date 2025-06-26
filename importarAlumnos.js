import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import path from 'node:path';

// Carga variables de entorno desde .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Definir un esquema genérico
const alumnoSchema = new mongoose.Schema({}, { strict: false });
const Alumno = mongoose.model('Alumno', alumnoSchema);

async function importarExcelAMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const filePath = path.resolve('public', 'alumnos.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const headers = worksheet
      .getRow(1)
      .values.map((h) => (h ? h.toString().trim().toLowerCase() : ''));
    const alumnos = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData = row.values.map((val) => (val ? val.toString().trim().toLowerCase() : ''));

      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = rowData[index];
      });

      alumnos.push(obj);
    });

    await Alumno.deleteMany({});
    await Alumno.insertMany(alumnos);

    console.log(`✅ Se importaron ${alumnos.length} alumnos`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al importar:', error);
    process.exit(1);
  }
}

importarExcelAMongo();
