import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Camera, ChevronDown } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const CATEGORIES = ['Tenis', 'Perfumes', 'Ropa', 'Accesorios', 'Electrónica'];

export default function AddProductScreen() {
  const { profile } = useAuthStore();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: CATEGORIES[0],
  });

  useEffect(() => {
    fetchStore();
    if (id) {
      fetchProductDetails();
    }
  }, [id, profile]);

  const fetchStore = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .eq('vendor_id', profile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newStore, error: createError } = await supabase
          .from('stores')
          .insert({ vendor_id: profile.id, name: `Tienda de ${profile.name}` })
          .select()
          .single();
        if (createError) throw createError;
        setStoreId(newStore.id);
      } else if (error) {
        throw error;
      } else {
        setStoreId(data.id);
      }
    } catch (err) {
      console.error('Error fetching/creating store:', err);
    }
  };

  const fetchProductDetails = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      setForm({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        stock: data.stock.toString(),
        category: data.category,
      });
      setImage(data.image_url);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setFetching(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    const fileName = `${Date.now()}.jpg`;
    const filePath = `products/${profile?.id}/${fileName}`;
    const contentType = 'image/jpeg';

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, decode(base64), { contentType });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!profile || !storeId) return;

    // Fix Hallazgo 8: Robust price/stock validation
    const numericPrice = parseFloat(form.price);
    const numericStock = parseInt(form.stock);

    if (!form.name || isNaN(numericPrice) || isNaN(numericStock)) {
      Alert.alert('Error', 'Por favor llena los campos obligatorios con valores numéricos válidos');
      return;
    }

    if (numericPrice <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0 pesos colombianos (COP)');
      return;
    }

    if (numericStock < 0) {
      Alert.alert('Error', 'El stock no puede ser negativo');
      return;
    }

    setLoading(true);
    try {
      let image_url = image;

      if (image && image.startsWith('file://')) {
        image_url = await uploadImageToSupabase(image);
      }

      const productData = {
        name: form.name,
        description: form.description,
        price: numericPrice,
        stock: numericStock,
        category: form.category,
        image_url,
        store_id: storeId,
      };

      if (id) {
        const { error } = await supabase.from('products').update(productData).eq('id', id);
        if (error) throw error;
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        Alert.alert('Éxito', 'Producto agregado correctamente');
      }

      router.replace('/(vendor_tabs)/my-products');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <ScrollView className="flex-1 bg-gray-50 px-6 py-6">
      <TouchableOpacity
        onPress={pickImage}
        className="bg-white border-2 border-dashed border-gray-300 rounded-2xl h-48 mb-6 items-center justify-center overflow-hidden"
      >
        {image ? (
          <Image source={{ uri: image }} className="w-full h-full" />
        ) : (
          <View className="items-center">
            <Camera size={40} color="#64748b" />
            <Text className="text-gray-400 mt-2 font-bold">Subir foto del producto</Text>
          </View>
        )}
      </TouchableOpacity>

      <View className="space-y-4 mb-10">
        <View>
          <Text className="text-gray-600 mb-2 font-semibold">Nombre del producto *</Text>
          <TextInput
            className="bg-white border border-gray-200 p-4 rounded-xl"
            placeholder="Ej: Tenis Air Cali"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />
        </View>

        <View>
          <Text className="text-gray-600 mb-2 font-semibold">Descripción</Text>
          <TextInput
            className="bg-white border border-gray-200 p-4 rounded-xl"
            placeholder="Características del producto..."
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-gray-600 mb-2 font-semibold">Precio (COP) *</Text>
            <TextInput
              className="bg-white border border-gray-200 p-4 rounded-xl"
              placeholder="150000"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(t) => setForm({ ...form, price: t })}
            />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-gray-600 mb-2 font-semibold">Stock *</Text>
            <TextInput
              className="bg-white border border-gray-200 p-4 rounded-xl"
              placeholder="10"
              keyboardType="numeric"
              value={form.stock}
              onChangeText={(t) => setForm({ ...form, stock: t })}
            />
          </View>
        </View>

        <View>
          <Text className="text-gray-600 mb-2 font-semibold">Categoría</Text>
          <View className="flex-row flex-wrap">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setForm({ ...form, category: cat })}
                className={`mr-2 mb-2 px-4 py-2 rounded-lg border ${
                  form.category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`font-semibold ${form.category === cat ? 'text-white' : 'text-gray-600'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !storeId}
          className={`bg-blue-600 py-4 rounded-xl items-center mt-6 ${loading || !storeId ? 'opacity-50' : ''}`}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'Guardando...' : id ? 'Actualizar Producto' : 'Publicar Producto'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
