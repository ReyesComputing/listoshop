import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profile as Profile);

        if (profile.role === 'buyer') {
          router.replace('/(buyer_tabs)');
        } else {
          router.replace('/(vendor_tabs)/dashboard');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
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
            <View>
              <Text className="text-gray-600 mb-2">Correo Electrónico</Text>
              <TextInput
                className="bg-white border border-gray-200 p-4 rounded-xl"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-gray-600 mb-2">Contraseña</Text>
              <TextInput
                className="bg-white border border-gray-200 p-4 rounded-xl"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`bg-blue-600 py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </Text>
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
