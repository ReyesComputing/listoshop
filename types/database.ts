export type UserRole = 'buyer' | 'vendor';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type EvidenceType = 'photo' | 'signature' | 'note';

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
  is_active: boolean;
  brand?: string;
  size?: string;
  color?: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_reference?: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  previous_status?: string;
  new_status: string;
  actor_id?: string;
  actor_role: 'buyer' | 'vendor' | 'system';
  note?: string;
  created_at: string;
}

export interface DeliveryEvidence {
  id: string;
  order_id: string;
  uploaded_by?: string;
  evidence_type: EvidenceType;
  file_url?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}
