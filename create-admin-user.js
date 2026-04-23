// Script para crear un usuario admin en Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuración - reemplaza con tus credenciales
const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'tu-clave-anonima';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // Crear usuario admin con UUID válido
    const adminUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: adminUserId,
        email: 'admin@bingo.com',
        password: '$2b$12$VjRzlTPekLxg70IheDu1Pu/LQ3Fy219Y2VIBwPVtoQoMc5mCqto/C',
        display_name: 'Administrador',
        credits: 999999,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creando usuario admin:', error);
    } else {
      console.log('✅ Usuario admin creado exitosamente:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createAdminUser();
