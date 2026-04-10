import { create } from 'zustand';
import { Product } from '../types/database';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  addItem: (product) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === product.id);

    let newItems;
    if (existingItem) {
      newItems = currentItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...currentItems, { ...product, quantity: 1 }];
    }

    const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    set({ items: newItems, total });
  },
  removeItem: (productId) => {
    const newItems = get().items.filter((item) => item.id !== productId);
    const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    set({ items: newItems, total });
  },
  updateQuantity: (productId, quantity) => {
    const newItems = get().items.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    const total = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    set({ items: newItems, total });
  },
  clearCart: () => set({ items: [], total: 0 }),
}));
