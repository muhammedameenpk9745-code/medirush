'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // product_id
  name: string;
  brand: string;
  genericComposition?: string;
  price: number; // selling price
  mrp?: number;
  image: string;
  quantity: number;
  prescriptionRequired: boolean;
  storeId: string;
  storeName: string;
  stock: number;
  packSize?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  hasPrescriptionRequiredItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load saved cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('medirush_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch {
      // Fallback
    }
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('medirush_cart', JSON.stringify(items));
    } catch {
      // Fallback
    }
  }, [items]);

  const addToCart = (product: any, qty = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);
      
      const maxStock = product.stock || 99;
      
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].quantity + qty, maxStock);
        updated[existingIndex].quantity = newQty;
        return updated;
      }

      const newItem: CartItem = {
        id: product.id,
        name: product.name || product.product_name,
        brand: product.brand || 'Medicine Brand',
        genericComposition: product.generic_composition || product.generic_name,
        price: Number(product.selling_price || product.price || 0),
        mrp: Number(product.mrp || product.selling_price || 0),
        image: product.image_url || product.image || '/medirush-logo.jpg',
        quantity: Math.min(qty, maxStock),
        prescriptionRequired: Boolean(product.prescription_required),
        storeId: product.store_id || product.seller_store_id || 'default-store',
        storeName: product.store_name || product.medical_stores?.store_name || 'Partner Pharmacy',
        stock: maxStock,
        packSize: product.pack_size || 'Strip',
      };

      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const maxStock = item.stock || 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPrescriptionRequiredItems = items.some((item) => item.prescriptionRequired);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        hasPrescriptionRequiredItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
