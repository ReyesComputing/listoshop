import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Fix Hallazgo 10: Enforce environment variables and avoid silent placeholders
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY. '
    + 'Crea un archivo .env con las credenciales de tu proyecto Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
