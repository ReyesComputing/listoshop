import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import '../global.css';

export default function RootLayout() {
  const { profile, setProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Hydrate Supabase session on init
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }
      }
      setIsReady(true);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData as Profile);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!profile && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      if (profile.role === 'buyer') {
        router.replace('/(buyer_tabs)');
      } else {
        router.replace('/(vendor_tabs)/dashboard');
      }
    }
  }, [profile, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(buyer_tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(vendor_tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
