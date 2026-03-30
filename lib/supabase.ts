import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY. '
    + 'Crea un archivo .env con las credenciales de tu proyecto Supabase.'
  );
}

let storage: any = undefined;
if (Platform.OS !== 'web') {
  // AsyncStorage solo en nativo
  storage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
