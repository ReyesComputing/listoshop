import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Profile } from '../../types/database';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor llena todos los campos');
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
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
            <Text className="text-3xl font-bold text-gray-800">ListoShop</Text>
            <Text className="text-gray-500 mt-1">Inicia sesión en tu cuenta</Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <Text className="text-red-600 text-center text-sm">{error}</Text>
            </View>
          ) : null}

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

          <View className="mb-6">
            <Text className="text-gray-600 mb-2 font-medium text-sm">Contraseña</Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl">
              <TextInput
                className="flex-1 p-4 text-base text-gray-800"
                placeholder="••••••••"
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

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`bg-blue-600 py-4 rounded-2xl items-center mb-6 ${loading ? 'opacity-60' : ''}`}
            style={{ elevation: 2 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-500">¿No tienes cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-bold">Regístrate</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
