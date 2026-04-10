import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Profile } from '../../types/database';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    setLoading(true);
    try {
      console.log('Intentando iniciar sesión para:', email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Error de autenticación:', authError.message);
        throw authError;
      }

      if (authData.user) {
        console.log('Usuario autenticado, obteniendo perfil...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('Error al obtener perfil:', profileError.message);
          // Si no hay perfil, podríamos estar ante un error de datos.
          // Intentamos cerrar sesión para no quedar en estado inconsistente.
          await supabase.auth.signOut();
          throw new Error('No se encontró un perfil asociado a esta cuenta. Por favor regístrate de nuevo.');
        }

        console.log('Perfil obtenido con éxito:', profile.role);
        setProfile(profile as Profile);

        // La redirección ocurrirá automáticamente en _layout.tsx gracias al useEffect de profile
      }
    } catch (error: any) {
      Alert.alert('Error de acceso', error.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
        <View className="flex-1 justify-center">
          <Text className="text-4xl font-bold text-blue-600 text-center mb-8">ListoShop</Text>
          <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">Bienvenido de nuevo</Text>

          <View className="space-y-4">
            <View className="mb-4">
              <Text className="text-gray-600 mb-2">Correo Electrónico</Text>
              <TextInput
                className="bg-white border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 mb-2">Contraseña</Text>
              <TextInput
                className="bg-white border border-gray-200 p-4 rounded-xl text-gray-800"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`bg-blue-600 py-4 rounded-xl items-center ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">¿No tienes cuenta? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-bold">Regístrate</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
