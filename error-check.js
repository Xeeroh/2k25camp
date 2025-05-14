const fs = require('fs');
const path = require('path');

// Función para verificar si un archivo JSON está bien formado
function checkJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✅ JSON válido: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en JSON: ${filePath}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Verificar los archivos JSON del proyecto
function checkProjectJsonFiles() {
  console.log('Verificando archivos JSON del proyecto...');
  const jsonFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'components.json'
  ];

  jsonFiles.forEach(file => {
    checkJsonFile(file);
  });
}

// Verificar si podemos importar recharts
function checkRecharts() {
  console.log('\nVerificando módulo recharts...');
  try {
    const rechartsPaths = [
      'node_modules/recharts/package.json',
      'node_modules/recharts/es6/component/Text.js',
      'node_modules/recharts/es6/util/ChartUtils.js'
    ];

    rechartsPaths.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ Archivo existe: ${file}`);
        if (file.endsWith('.json')) {
          checkJsonFile(file);
        }
      } else {
        console.log(`❌ Archivo no existe: ${file}`);
      }
    });
  } catch (error) {
    console.error(`❌ Error verificando recharts: ${error.message}`);
  }
}

// Verificar si podemos importar @radix-ui/react-popper
function checkRadixPopper() {
  console.log('\nVerificando módulo @radix-ui/react-popper...');
  try {
    const popperPaths = [
      'node_modules/@radix-ui/react-popper/package.json',
      'node_modules/@radix-ui/react-popper/dist/index.mjs'
    ];

    popperPaths.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ Archivo existe: ${file}`);
        if (file.endsWith('.json')) {
          checkJsonFile(file);
        }
      } else {
        console.log(`❌ Archivo no existe: ${file}`);
      }
    });
  } catch (error) {
    console.error(`❌ Error verificando @radix-ui/react-popper: ${error.message}`);
  }
}

// Ejecutar verificaciones
console.log('=== Verificador de Errores ===');
checkProjectJsonFiles();
checkRecharts();
checkRadixPopper(); 