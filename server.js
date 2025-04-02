import express from 'express';
import cors from 'cors';
import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';

const PORT = 2222;

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

// Ruta del archivo Excel
const filePath = path.resolve('public', 'alumnos.xlsx');

// Función para cargar y convertir el Excel en JSON
async function loadExcelData() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado en: ${filePath}`);
      return [];
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0]; // Obtener la primera hoja

    // Convertir las filas en un array de objetos tipo JSON
    const data = [];
    const headers = worksheet.getRow(1).values.map((h) => h?.toString().trim().toLowerCase());

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar la cabecera

      const rowData = row.values.map((val) => (val ? val.toString().trim().toLowerCase() : ''));
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = rowData[index];
      });

      data.push(obj);
    });

    return data;
  } catch (error) {
    console.error('❌ Error al leer el archivo Excel:', error);
    return [];
  }
}

// Endpoint para buscar el código del estudiante
app.post('/buscar-codigo', async (req, res) => {
  console.log('🔍 Petición recibida:', req.body);
  const { apellido1, apellido2, nombre1 } = req.body;

  try {
    const worksheet = await loadExcelData();

    const estudiante = worksheet.find(
      (row) =>
        row['apellido1'] === apellido1.trim().toLowerCase() &&
        row['apellido2'] === apellido2.trim().toLowerCase() &&
        row['nombre1'] === nombre1.trim().toLowerCase(),
    );

    if (estudiante) {
      return res.status(200).json({ codigo: estudiante['codigo'] });
    } else {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
