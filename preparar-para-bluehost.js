#!/usr/bin/env node

/**
 * Script para preparar el proyecto para despliegue en Bluehost
 * Ejecuta: node preparar-para-bluehost.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando proyecto para Bluehost...\n');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Paso 1: Verificar que estamos en el directorio correcto
if (!fs.existsSync('package.json')) {
  log('❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto.', 'red');
  process.exit(1);
}

log('✅ Proyecto encontrado', 'green');

// Paso 2: Crear carpeta de despliegue
const deployDir = 'bluehost-deploy';
if (fs.existsSync(deployDir)) {
  log('🗑️  Eliminando carpeta de despliegue anterior...', 'yellow');
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

log('✅ Carpeta de despliegue creada', 'green');

// Paso 3: Lista de archivos/carpetas a copiar
const filesToCopy = [
  'app',
  'components',
  'lib',
  'hooks',
  'public',
  'styles',
  'middleware.ts',
  'next.config.mjs',
  'next-env.d.ts',
  'tsconfig.json',
  'package.json',
  'server.js',
  'postcss.config.mjs',
  'components.json',
];

// Archivos opcionales (si existen)
const optionalFiles = [
  'tailwind.config.js',
  'tailwind.config.ts',
];

// Directorios y archivos a excluir
const excludeDirs = [
  'node_modules',  // No copiar node_modules del proyecto original
  '.next',         // No copiar .next del proyecto original
  '.git',
  '.vercel',
  'bluehost-deploy',
  'debug',
  'test',
  'test-env',
  'test-supabase',
  'test-bingo',
  'setup',
  'test-cleanup',
  'cleanup-duplicates',
  'fix-card-assignments',
  'manual-fix-cards',
  'register-direct',
  'execute-sql',
  'check-config',
  'check-user',
  'check-users',
  'check-winners',
  'clean-all-card-numbers',
  'clean-card-numbers',
  'clean-duplicates',
  'clean-game-numbers',
  'clean-numbers',
  'clear-reservations',
  'create-user',
  'all-games-status',
  'cards-status',
  'simple-test',
  'test-approval',
  'auth-status',
  'user-status',
  'games-status',
  'rls-status',
  'next-game'
];

const excludeFiles = [
  '.backup',
  '.new',
  '.test.',
  'test-',
  'debug-',
  'ARCHIVOS_A_SUBIR.txt',
  'verificar-instalacion.sh',
  '.md' // Excluir todos los archivos de documentación
];

// Función para copiar directorios recursivamente
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Omitir directorios innecesarios
      if (excludeDirs.includes(entry.name)) {
        log(`  ⏭️  Omitiendo carpeta: ${entry.name}`, 'yellow');
        continue;
      }
      copyDirectory(srcPath, destPath);
    } else {
      // Omitir archivos innecesarios
      const shouldExclude = excludeFiles.some(pattern => 
        entry.name.includes(pattern) || entry.name.endsWith(pattern)
      );
      
      // Excluir todos los .md
      if (shouldExclude) {
        log(`  ⏭️  Omitiendo archivo: ${entry.name}`, 'yellow');
        continue;
      }
      
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Paso 4: Copiar archivos
log('\n📦 Copiando archivos...', 'blue');

filesToCopy.forEach(item => {
  const sourcePath = path.join(process.cwd(), item);
  const destPath = path.join(process.cwd(), deployDir, item);
  
  if (fs.existsSync(sourcePath)) {
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDirectory(sourcePath, destPath);
      log(`  ✓ ${item}/`, 'green');
    } else {
      fs.copyFileSync(sourcePath, destPath);
      log(`  ✓ ${item}`, 'green');
    }
  } else {
    log(`  ⚠ ${item} no encontrado (se omite)`, 'yellow');
  }
});

// Copiar archivos opcionales
optionalFiles.forEach(item => {
  const sourcePath = path.join(process.cwd(), item);
  const destPath = path.join(process.cwd(), deployDir, item);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    log(`  ✓ ${item}`, 'green');
  }
});

// Paso 5: Crear archivo .env.local de ejemplo
log('\n📝 Creando archivo .env.local de ejemplo...', 'blue');

const envExample = `# ============================================
# Variables de Entorno para Bluehost
# ============================================
# IMPORTANTE: Reemplaza los valores con tus datos reales
# Luego renombra este archivo a .env.local en el servidor

NODE_ENV=production

# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://lwczeimcljkxsoukiwsa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3plaW1jbGpreHNvdWtpd3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzUwNzEsImV4cCI6MjA3NDY1MTA3MX0.0pBwQndN3kliELCoKSBZnCDRpqny_o8cGKUSQLYPfT8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3plaW1jbGpreHNvdWtpd3NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NTA3MSwiZXhwIjoyMDc0NjUxMDcxfQ.WTWloMV7APc_NJBSWKiY2veMdxeogNkdaoPmXB_xnMM

# Variables adicionales para algunos archivos (usan sin NEXT_PUBLIC)
SUPABASE_URL=https://lwczeimcljkxsoukiwsa.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3plaW1jbGpreHNvdWtpd3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzUwNzEsImV4cCI6MjA3NDY1MTA3MX0.0pBwQndN3kliELCoKSBZnCDRpqny_o8cGKUSQLYPfT8

# App URL (REQUERIDO - Reemplaza con tu dominio)
NEXT_PUBLIC_APP_URL=https://thebingofortuna.com/bingo

# JWT Secret (RECOMENDADO - Genera una clave segura)
JWT_SECRET=genera-una-clave-segura-aqui

# CRON Secret (OPCIONAL - Para seguridad de cron jobs)
CRON_SECRET=genera-otra-clave-segura-aqui

# SMTP para emails (OPCIONAL)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu-email@gmail.com
# SMTP_PASS=tu-contraseña-de-aplicacion

# Puerto (generalmente 3000, Bluehost lo configura automáticamente)
PORT=3000
`;

// Crear .env.local ANTES de construir
fs.writeFileSync(path.join(deployDir, '.env.local'), envExample);
log('  ✓ .env.local creado', 'green');

// No crear README (archivo innecesario para el funcionamiento)

// Paso 7: Crear archivo .gitignore para la carpeta de despliegue
log('\n🔒 Creando .gitignore...', 'blue');

const gitignore = `# Archivos que NO deben subirse a Bluehost
node_modules/
.next/
.git/
.vercel/
*.log
.DS_Store
Thumbs.db
.env
.env.local
.env*.local
bluehost-deploy/
`;

fs.writeFileSync(path.join(deployDir, '.gitignore'), gitignore);
log('  ✓ .gitignore creado', 'green');

// Paso 8: Crear lista de archivos a subir
log('\n📋 Creando lista de archivos...', 'blue');

const fileList = `ARCHIVOS_A_SUBIR.txt

Esta es la lista de archivos y carpetas que DEBES subir a Bluehost:

CARPETAS:
- app/
- components/
- lib/
- hooks/
- public/
- styles/

ARCHIVOS:
- middleware.ts
- next.config.mjs
- next-env.d.ts
- tsconfig.json
- package.json
- server.js
- postcss.config.mjs
- components.json
- .env.local (renombrado desde .env.local.example)
- .gitignore

IMPORTANTE:
- NO subir node_modules/ (se instalará en el servidor)
- NO subir .next/ (se generará en el servidor)
- NO subir .git/
- NO subir esta lista de archivos

TAMAÑO ESTIMADO: ~5-10 MB (sin node_modules)
`;

// No crear ARCHIVOS_A_SUBIR.txt (archivo innecesario)

// Paso 9: Verificar package.json y crear package.json optimizado
log('\n📦 Verificando package.json...', 'blue');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Asegurar que tiene los scripts necesarios
if (!packageJson.scripts.start) {
  packageJson.scripts.start = 'next start';
}
if (!packageJson.scripts.build) {
  packageJson.scripts.build = 'next build';
}

// Guardar package.json optimizado
fs.writeFileSync(
  path.join(deployDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
log('  ✓ package.json optimizado', 'green');

// Paso 10: Crear script de verificación
log('\n✅ Creando script de verificación...', 'blue');

const verifyScript = `#!/bin/bash
# Script de verificación para después de subir a Bluehost
# Ejecuta: bash verificar-instalacion.sh

echo "🔍 Verificando instalación en Bluehost..."
echo ""

# Verificar archivos esenciales
echo "Verificando archivos esenciales:"
[ -f "package.json" ] && echo "  ✓ package.json" || echo "  ✗ package.json FALTA"
[ -f "server.js" ] && echo "  ✓ server.js" || echo "  ✗ server.js FALTA"
[ -f "next.config.mjs" ] && echo "  ✓ next.config.mjs" || echo "  ✗ next.config.mjs FALTA"
[ -f ".env.local" ] && echo "  ✓ .env.local" || echo "  ✗ .env.local FALTA (renombra .env.local.example)"

echo ""
echo "Verificando carpetas:"
[ -d "app" ] && echo "  ✓ app/" || echo "  ✗ app/ FALTA"
[ -d "components" ] && echo "  ✓ components/" || echo "  ✗ components/ FALTA"
[ -d "lib" ] && echo "  ✓ lib/" || echo "  ✗ lib/ FALTA"
[ -d "public" ] && echo "  ✓ public/" || echo "  ✗ public/ FALTA"

echo ""
echo "✅ Verificación completada"
`;

// No crear verificar-instalacion.sh (archivo innecesario)

// Paso Final: Instalar y construir en la carpeta de despliegue
log('\n📦 Instalando dependencias en carpeta de despliegue...', 'blue');
log('   Esto puede tardar 5-10 minutos...', 'yellow');

try {
  // Copiar package.json primero
  const packageJsonPath = path.join(deployDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    // Instalar dependencias en la carpeta de despliegue
    log('   Instalando dependencias...', 'blue');
    execSync('npm install --production', { 
      cwd: path.join(process.cwd(), deployDir),
      stdio: 'inherit'
    });
    log('   ✓ Dependencias instaladas', 'green');

    // Construir la aplicación
    log('   Construyendo aplicación...', 'blue');
    execSync('npm run build', { 
      cwd: path.join(process.cwd(), deployDir),
      stdio: 'inherit'
    });
    log('   ✓ Aplicación construida', 'green');
  }
} catch (error) {
  log('   ⚠️  Error al instalar/construir automáticamente', 'yellow');
  log('   Ejecuta manualmente:', 'yellow');
  log('   cd bluehost-deploy', 'yellow');
  log('   npm install --production', 'yellow');
  log('   npm run build', 'yellow');
}

// Resumen final
log('\n' + '='.repeat(50), 'blue');
log('✅ PREPARACIÓN COMPLETADA', 'green');
log('='.repeat(50), 'blue');
log('\n📁 Carpeta creada: bluehost-deploy/', 'green');
log('\n📋 Próximos pasos:', 'yellow');
log('  1. Si no se instalaron dependencias automáticamente:', 'yellow');
log('     cd bluehost-deploy', 'yellow');
log('     npm install --production', 'yellow');
log('     npm run build', 'yellow');
log('  2. Revisa y edita bluehost-deploy/.env.local (reemplaza TUDOMINIO.com)', 'yellow');
log('  3. Comprime TODO el contenido de bluehost-deploy/ (incluyendo node_modules y .next)', 'yellow');
log('  4. Sube el ZIP a Bluehost → public_html/bingo/', 'yellow');
log('  5. Crea aplicación Node.js y configura variables', 'yellow');
log('\n');

