import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';

// Cart item interface extending Product with quantity
export interface CartItem extends Product {
  quantity: number;
  selectedVariations?: Record<string, string>;
}

// Context interface
interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variations?: Record<string, string>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getTotal: () => number;
  isInCart: (productId: string) => boolean;
}

// Create context with default values
const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key
const CART_STORAGE_KEY = 'apm_cart';

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Initialize state from localStorage
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  // Add item to cart
  const addToCart = (
    product: Product, 
    quantity: number = 1, 
    variations?: Record<string, string>
  ) => {
    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(item => item.id === product.id);
      
      if (existingIndex >= 0) {
        // Item already in cart, update quantity
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          selectedVariations: variations || updated[existingIndex].selectedVariations
        };
        return updated;
      }
      
      // New item, add to cart
      const newItem: CartItem = {
        ...product,
        quantity,
        selectedVariations: variations
      };
      return [...currentItems, newItem];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
  };

  // Get total item count
  const getItemCount = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Get subtotal (before shipping)
  const getSubtotal = (): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate shipping (free if subtotal > 100000 Kz)
  const getShipping = (): number => {
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    if (subtotal >= 100000) return 0; // Free shipping over 100,000 Kz
    return 2500; // Standard shipping
  };

  // Get total with shipping
  const getTotal = (): number => {
    return getSubtotal() + getShipping();
  };

  // Check if product is in cart
  const isInCart = (productId: string): boolean => {
    return items.some(item => item.id === productId);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getShipping,
    getTotal,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
