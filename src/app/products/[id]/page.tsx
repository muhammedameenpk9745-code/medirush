'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ShieldAlert, Store, ShoppingBag, ArrowLeft, CheckCircle2, AlertTriangle, Plus, Minus, Zap } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories, getCategoryMap } from '@/lib/categories';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const supabase = createClient();

  const [product, setProduct] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);

    try {
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);

      const { data } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug), medical_stores(*)')
        .eq('id', params.id)
        .single();

      if (data) setProduct(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      router.push('/cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-7xl mx-auto w-full p-8 text-center text-xs text-slate-500">
          Loading medicine details...
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="grow max-w-7xl mx-auto w-full p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Medicine Product Not Found</h2>
          <Link href="/products">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isOutStock = product.is_active === false;
  const storeName = product.medical_stores?.store_name || 'Partner Pharmacy';
  const displayName = product.product_name || product.name || 'Medicine';
  const displayGeneric = product.generic_name || product.generic_composition || product.brand;
  const catMap = getCategoryMap(categories);
  const categoryName = product.product_categories?.name || catMap.get(product.category_id) || product.category;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medicines</span>
        </Link>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm text-center space-y-4">
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden flex items-center justify-center">
              {product.image_url ? (
                <Image src={product.image_url} alt={displayName} fill className="object-contain p-4" priority />
              ) : (
                <Package className="w-20 h-20 text-slate-300" />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Genuine Product sourced from licensed local pharmacy</span>
            </div>
          </div>

          {/* Right Column: Medicine Specs & Ordering */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
            
            {/* Header Details */}
            <div className="space-y-2 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {categoryName && (
                  <span className="bg-brand-50 text-brand-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-brand-200 uppercase">
                    {categoryName}
                  </span>
                )}
                {product.dosage_form && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                    {product.dosage_form}
                  </span>
                )}
                {product.prescription_required && (
                  <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-200 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Rx Required</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{displayName}</h1>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Active Composition: <strong className="text-slate-900">{displayGeneric}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Manufacturer: {product.manufacturer || product.brand} • Pack Size: {product.pack_size || 'Strip'}
              </p>
            </div>

            {/* Pharmacy Source Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{storeName}</p>
                  <p className="text-[10px] text-slate-500">Licensed Pharmacy Partner</p>
                </div>
              </div>

              {product.medical_stores?.id && (
                <Link href={`/stores/${product.medical_stores.id}`}>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </Link>
              )}
            </div>

            {/* Rx Banner */}
            {product.prescription_required && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Prescription Required for this Medicine</p>
                  <p className="text-red-700 text-[11px]">
                    You must upload a valid doctor&apos;s prescription during checkout before this order can be processed.
                  </p>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-black text-slate-900">₹{product.selling_price}</span>
              {product.mrp && Number(product.mrp) > Number(product.selling_price) && (
                <>
                  <span className="text-sm text-slate-400 line-through">MRP ₹{product.mrp}</span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {Math.round(((Number(product.mrp) - Number(product.selling_price)) / Number(product.mrp)) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Quantity Selector & CTAs */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase text-slate-500">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-bold text-xs text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min((product.stock || 99), q + 1))}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isOutStock}
                  onClick={() => addToCart(product, quantity)}
                  leftIcon={<ShoppingBag className="w-4 h-4 text-brand-600" />}
                >
                  Add to Cart
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={isOutStock}
                  onClick={handleBuyNow}
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Product Specifications & Usage */}
            {product.description && (
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Medical Description & Uses</p>
                <p className="text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              <strong>Medical Disclaimer:</strong> MediRush connects you with licensed local pharmacies. Always consult a qualified medical doctor before consuming prescription drugs.
            </div>

          </div>

        </div>

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
