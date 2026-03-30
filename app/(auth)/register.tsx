import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Profile, UserRole } from '../../types/database';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !name) {
      setError('Por favor llena todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse';
      setError(msg);
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
          <View className="items-center mb-8">
            <View className="bg-blue-600 w-20 h-20 rounded-2xl items-center justify-center mb-4" style={{ elevation: 4 }}>
              <Text className="text-white text-3xl font-bold">L</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800">Crear cuenta</Text>
            <Text className="text-gray-500 mt-1">Únete a ListoShop</Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <Text className="text-red-600 text-center text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-medium text-sm">Nombre Completo</Text>
            <TextInput
              className="bg-white border border-gray-200 p-4 rounded-2xl text-base text-gray-800"
              placeholder="Juan Pérez"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-medium text-sm">Correo Electrónico</Text>
            <TextInput
              className="bg-white border border-gray-200 p-4 rounded-2xl text-base text-gray-800"
              placeholder="tu@email.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 mb-2 font-medium text-sm">Contraseña</Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl">
              <TextInput
                className="flex-1 p-4 text-base text-gray-800"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-4">
                {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-600 mb-2 font-medium text-sm">Tipo de cuenta</Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setRole('buyer')}
                className={`flex-1 p-4 rounded-2xl items-center border mr-3 ${
                  role === 'buyer' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                }`}
              >
                <Text className="text-xl mb-1">🛒</Text>
                <Text className={`font-bold text-sm ${role === 'buyer' ? 'text-white' : 'text-gray-600'}`}>
                  Comprador
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole('vendor')}
                className={`flex-1 p-4 rounded-2xl items-center border ${
                  role === 'vendor' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                }`}
              >
                <Text className="text-xl mb-1">🏪</Text>
                <Text className={`font-bold text-sm ${role === 'vendor' ? 'text-white' : 'text-gray-600'}`}>
                  Vendedor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`bg-blue-600 py-4 rounded-2xl items-center mb-6 ${loading ? 'opacity-60' : ''}`}
            style={{ elevation: 2 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Registrarse</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-500">¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-bold">Inicia Sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
