'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Store, Trash2, Plus, Minus, ArrowRight, ShieldAlert, CheckCircle2, ArrowLeft, Package } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { useCart, CartItem } from '@/context/CartContext';
import { calculateDeliveryFee } from '@/lib/constants/delivery';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, hasPrescriptionRequiredItems } = useCart();

  // Group items by Pharmacy Store
  const storeGroupedItems = items.reduce<Record<string, { storeName: string; items: CartItem[] }>>((acc, item) => {
    const sId = item.storeId || 'default';
    if (!acc[sId]) {
      acc[sId] = { storeName: item.storeName || 'Partner Pharmacy', items: [] };
    }
    acc[sId].items.push(item);
    return acc;
  }, {});

  const deliveryFee = calculateDeliveryFee(subtotal);
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Title & Clear */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Your Shopping Cart</h1>
            <p className="text-xs text-slate-500">Review items grouped by pharmacy before proceeding to checkout</p>
          </div>

          {items.length > 0 && (
            <Button variant="outline" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={clearCart}>
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm space-y-4 max-w-md mx-auto">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500">Explore our local pharmacy catalog to add genuine prescription medicines and healthcare products.</p>
            <Link href="/products" className="inline-block pt-2">
              <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Browse Medicines
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left 2 Columns: Multi-Seller Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              
              {hasPrescriptionRequiredItems && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Prescription Required Notice</p>
                    <p className="text-red-700 text-[11px] mt-0.5">
                      Your cart contains medicines that require a valid doctor&apos;s prescription. You will be prompted to upload your prescription during checkout.
                    </p>
                  </div>
                </div>
              )}

              {Object.entries(storeGroupedItems).map(([storeId, group]) => (
                <div key={storeId} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-4">
                  {/* Store Section Header */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Store className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Fulfilled by {group.storeName}
                    </span>
                  </div>

                  {/* Store Items List */}
                  <div className="divide-y divide-slate-100 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                              {item.prescriptionRequired && (
                                <span className="bg-red-50 text-red-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-red-200">
                                  Rx
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500">{item.brand} • {item.packSize || 'Strip'}</p>
                            <p className="font-black text-slate-900 text-sm">₹{item.price}</p>
                          </div>
                        </div>

                        {/* Quantity Controls & Remove */}
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 font-bold text-xs text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))}

            </div>

            {/* Right Column: Order Summary */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    <span className="font-bold text-slate-900">₹{deliveryFee}</span>
                  )}
                </div>

                {deliveryFee > 0 && (
                  <p className="text-[11px] text-brand-600 italic">
                    Add ₹{499 - subtotal} more for FREE Delivery!
                  </p>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-xl text-slate-900">₹{grandTotal}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push('/checkout')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Checkout
              </Button>
            </div>

          </div>
        )}

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
