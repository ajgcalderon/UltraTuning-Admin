import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno o argumentos
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(`
Uso:
  node scripts/create-admin.mjs <correo> <contraseña>

Ejemplo:
  node scripts/create-admin.mjs admin@ultratuning.ve MiContraseñaSegura123!
`);
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(`
Error: Faltan las variables de entorno:
  - VITE_SUPABASE_URL (o PUBLIC_SUPABASE_URL)
  - SUPABASE_SERVICE_ROLE_KEY

Asegúrate de exportarlas o definirlas en tu archivo de entorno antes de ejecutar este script.
`);
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log(`Creando usuario administrador para: ${email}...`);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmado automáticamente sin requerir clic en email
    user_metadata: {
      role: 'admin',
      name: 'Dueño del Sitio',
    },
  });

  if (error) {
    console.error('Error al crear usuario:', error.message);
    process.exit(1);
  }

  console.log('✅ Usuario administrador creado exitosamente:');
  console.log(`   ID: ${data.user.id}`);
  console.log(`   Email: ${data.user.email}`);
  console.log('\nYa puedes iniciar sesión en el panel admin con estas credenciales.');
}

main();
