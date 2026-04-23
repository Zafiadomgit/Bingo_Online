
# Configuración de Base de Datos para Hosting (PostgreSQL)

Para que tu aplicación funcione con la base de datos PostgreSQL de tu hosting, debes configurar las siguientes variables de entorno en tu panel de control (cPanel / Node.js App):

## Variables de Base de Datos
DB_HOST=localhost            # O la IP de tu servidor de base de datos
DB_PORT=5432                 # Puerto por defecto de PostgreSQL
DB_NAME=nombre_base_datos    # Nombre de tu base de datos
DB_USER=usuario_base_datos   # Usuario de la base de datos
DB_PASSWORD=contraseña_bd    # Contraseña del usuario

## Variables de Aplicación
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
JWT_SECRET=genera-un-secreto-seguro-aqui

## NOTA IMPORTANTE
Ya no necesitas las variables de `SUPABASE_Url` ni `SUPABASE_ANON_KEY`, pero si quieres mantener compatibilidad con alguna función antigua, puedes dejarlas, aunque la aplicación principal ya no las usará.

## Pasos para desplegar:
1. Sube los archivos al hosting.
2. Ejecuta `npm install`.
3. Ejecuta `npm run build`.
4. Importa el archivo `schema.sql` en tu base de datos PostgreSQL usando phpPgAdmin o psql.
   - Este archivo crea las tablas necesarias (users, bingo_games, bingo_cards, etc).
