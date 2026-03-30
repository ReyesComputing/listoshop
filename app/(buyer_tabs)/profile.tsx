import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Order, Profile } from '../../types/database';
import { User, LogOut, Package, MapPin, Phone, Edit3, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending_payment: { bg: '#fef9c3', text: '#a16207' },
  paid: { bg: '#dcfce7', text: '#15803d' },
  ready_for_dispatch: { bg: '#e0e7ff', text: '#4338ca' },
  shipped: { bg: '#dbeafe', text: '#1d4ed8' },
  delivered: { bg: '#d1fae5', text: '#047857' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
  failed: { bg: '#f3f4f6', text: '#374151' },
};

export default function ProfileScreen() {
  const { profile, setProfile, signOut } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editAddress, setEditAddress] = useState(profile?.address || '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchOrders = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [profile]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: editName, phone: editPhone, address: editAddress })
        .eq('id', profile.id)
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_payment: 'Pendiente de pago', paid: 'Pagado',
      ready_for_dispatch: 'Listo para despacho', shipped: 'Enviado',
      delivered: 'Entregado', cancelled: 'Cancelado', failed: 'Fallido',
    };
    return labels[status] ?? status;
  };

  const getStatusStyle = (status: string) => STATUS_STYLES[status] ?? { bg: '#f3f4f6', text: '#374151' };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <TouchableOpacity
              onPress={() => router.push(`/order/${item.id}`)}
              className="bg-white p-4 rounded-2xl mb-3 mx-4"
              style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-gray-800">Orden #{item.id.slice(0, 8)}</Text>
                <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: '700' }}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 text-sm">{formatDate(item.created_at)}</Text>
                <Text className="text-blue-600 font-bold">{formatPrice(item.total_amount)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <View className="p-6">
            {/* User header */}
            <View className="flex-row items-center mb-6">
              <View className="bg-blue-600 p-4 rounded-2xl" style={{ elevation: 4 }}>
                <User size={36} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-gray-800">{profile?.name}</Text>
                <Text className="text-gray-500 text-sm">{profile?.email}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} className="p-3 rounded-xl bg-red-50">
                <LogOut size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* Profile info */}
            <View className="bg-white p-5 rounded-2xl mb-8" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              {editing ? (
                <View>
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Nombre</Text>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      className="border border-gray-200 rounded-xl p-3 text-gray-800"
                    />
                  </View>
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Teléfono</Text>
                    <TextInput
                      value={editPhone}
                      onChangeText={setEditPhone}
                      keyboardType="phone-pad"
                      placeholder="+57 300 000 0000"
                      className="border border-gray-200 rounded-xl p-3 text-gray-800"
                    />
                  </View>
                  <View className="mb-4">
                    <Text className="text-xs text-gray-500 mb-1">Dirección de envío</Text>
                    <TextInput
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="Calle, barrio, ciudad"
                      className="border border-gray-200 rounded-xl p-3 text-gray-800"
                    />
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-blue-600 py-3 rounded-xl items-center flex-row justify-center"
                    >
                      <Check size={18} color="white" />
                      <Text className="text-white font-bold ml-1">
                        {saving ? 'Guardando...' : 'Guardar'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditing(false)}
                      className="flex-1 bg-gray-200 py-3 rounded-xl items-center ml-3"
                    >
                      <Text className="text-gray-700 font-bold">Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View className="flex-row items-center mb-3">
                    <MapPin size={20} color="#64748b" />
                    <Text className="ml-3 text-gray-600 flex-1">
                      {profile?.address || 'Sin dirección — toca editar'}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Phone size={20} color="#64748b" />
                    <Text className="ml-3 text-gray-600 flex-1">
                      {profile?.phone || 'Sin teléfono — toca editar'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditName(profile?.name || '');
                      setEditPhone(profile?.phone || '');
                      setEditAddress(profile?.address || '');
                      setEditing(true);
                    }}
                    className="bg-gray-100 py-2 rounded-xl items-center flex-row justify-center mt-1"
                  >
                    <Edit3 size={16} color="#2563eb" />
                    <Text className="text-blue-600 font-semibold ml-1">Editar perfil</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View className="flex-row items-center mb-4">
              <Package size={24} color="#2563eb" />
              <Text className="ml-2 text-xl font-bold text-gray-800">Mis Pedidos</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-4xl mb-2">📦</Text>
            <Text className="text-gray-400">Aún no has realizado pedidos</Text>
          </View>
        }
      />
    </View>
  );
}
