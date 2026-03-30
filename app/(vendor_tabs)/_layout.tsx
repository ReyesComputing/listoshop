import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, PlusCircle, Package, User } from 'lucide-react-native';

export default function VendorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb', // blue-600
        tabBarInactiveTintColor: '#64748b', // slate-500
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          headerTitle: 'Panel del Vendedor',
        }}
      />
      <Tabs.Screen
        name="my-products"
        options={{
          title: 'Mis Productos',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
          headerTitle: 'Inventario',
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Nuevo',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
          headerTitle: 'Agregar Producto',
        }}
      />
    </Tabs>
  );
}
