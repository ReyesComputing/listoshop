import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Profile, UserRole } from '../../types/database';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            name,
            role,
          })
          .select('*')
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
      Alert.alert('Error', error.message || 'Error al registrarse');
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
          <Text className="text-4xl font-bold text-blue-600 text-center mb-4">ListoShop</Text>
          <Text className="text-2xl font-semibold text-gray-800 mb-6 text-center">Crear cuenta</Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-600 mb-2">Nombre Completo</Text>
              <TextInput
                className="bg-white border border-gray-200 p-4 rounded-xl"
                placeholder="Juan Pérez"
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <View>
              <Text className="text-gray-600 mb-2">Tipo de cuenta</Text>
              <View className="flex-row space-x-4 mb-4">
                <TouchableOpacity
                  onPress={() => setRole('buyer')}
                  className={`flex-1 p-4 rounded-xl items-center border ${
                    role === 'buyer' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`font-bold ${role === 'buyer' ? 'text-white' : 'text-gray-600'}`}>
                    Comprador
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole('vendor')}
                  className={`flex-1 p-4 rounded-xl items-center border ${
                    role === 'vendor' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`font-bold ${role === 'vendor' ? 'text-white' : 'text-gray-600'}`}>
                    Vendedor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`bg-blue-600 py-4 rounded-xl items-center mt-4 ${loading ? 'opacity-50' : ''}`}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? 'Registrando...' : 'Registrarse'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-600">¿Ya tienes cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-bold">Inicia Sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
