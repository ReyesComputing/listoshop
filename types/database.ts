export type UserRole = 'buyer' | 'vendor';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Store {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}
