'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpDown, ShieldAlert, Package, ShoppingBag, Store, Sparkles, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories, getCategoryMap } from '@/lib/categories';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category');

  const { addToCart } = useCart();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryQuery || 'ALL');
  const [rxFilter, setRxFilter] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  // Sync category state when URL search param changes
  useEffect(() => {
    if (categoryQuery) {
      setSelectedCategory(categoryQuery);
    }
  }, [categoryQuery]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const fetchProductsAndCategories = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Categories
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);

      // 2. Fetch Active Products
      const { data: prodData } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug), medical_stores(store_name, city, rating)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodData) setProducts(prodData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((p) => {
      const prodName = p.product_name || p.name || '';
      const genName = p.generic_name || p.generic_composition || '';

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = prodName.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchGeneric = genName.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchGeneric) return false;
      }

      // Category Filter
      if (selectedCategory !== 'ALL') {
        const selLower = selectedCategory.toLowerCase();
        const matchesId = p.category_id === selectedCategory;
        const prodCatName = (p.product_categories?.name || p.category || '').toLowerCase();
        const matchesName = prodCatName === selLower || prodCatName.includes(selLower) || selLower.includes(prodCatName);

        // Fallback broad category mapping for standard healthcare categories
        let matchesMapping = false;
        if (selLower === 'medicines') {
          matchesMapping = ['tablet', 'capsule', 'syrup', 'suspension', 'injection', 'powder', 'sachet', 'solution', 'suppository', 'drops', 'spray', 'inhaler', 'medicine'].some((t) => prodCatName.includes(t));
        } else if (selLower === 'first aid') {
          matchesMapping = ['surgical supply', 'bandage', 'ointment', 'cream', 'gel', 'first aid', 'cotton'].some((t) => prodCatName.includes(t));
        } else if (selLower === 'medical devices') {
          matchesMapping = ['medical device', 'equipment', 'monitor', 'oximeter', 'thermometer'].some((t) => prodCatName.includes(t));
        } else if (selLower === 'personal care') {
          matchesMapping = ['personal care', 'lotion', 'cream', 'gel', 'skin', 'care', 'hygiene'].some((t) => prodCatName.includes(t));
        } else if (selLower === 'wellness' || selLower === 'health essentials') {
          matchesMapping = true; // Show active products in broad wellness/essentials
        }

        if (!matchesId && !matchesName && !matchesMapping) return false;
      }

      // Rx Filter
      if (rxFilter === 'REQUIRED' && !p.prescription_required) return false;
      if (rxFilter === 'OTC' && p.prescription_required) return false;

      // In Stock / Active Filter
      if (inStockOnly && p.is_active === false) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return Number(a.selling_price) - Number(b.selling_price);
      if (sortBy === 'price_high') return Number(b.selling_price) - Number(a.selling_price);
      return 0;
    });

  return (
    <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-soft-sm rounded-xl font-extrabold px-4 py-2"
        >
          Back
        </Button>

        {selectedCategory !== 'ALL' && (
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            Category: <strong className="text-brand-600">{selectedCategory}</strong>
          </span>
        )}
      </div>

      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-soft-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] uppercase font-black px-3 py-1 rounded-full">
            Genuine Medicines & Local Delivery
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            {selectedCategory !== 'ALL' ? `${selectedCategory} Products` : 'Browse Local Pharmacy Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Find verified prescription medicines and OTC healthcare essentials from licensed pharmacies near you.
          </p>
        </div>
        <Sparkles className="w-16 h-16 text-brand-400/30 shrink-0 hidden sm:block" />
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <Input
            placeholder="Search medicine, composition, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="ALL">All Categories</option>
            <optgroup label="Healthcare Categories">
              <option value="Medicines">Medicines</option>
              <option value="First Aid">First Aid</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Baby Care">Baby Care</option>
              <option value="Medical Devices">Medical Devices</option>
              <option value="Wellness">Wellness</option>
              <option value="Health Essentials">Health Essentials</option>
            </optgroup>
            {categories.length > 0 && (
              <optgroup label="Dosage Forms">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Rx Filter */}
          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="ALL">All Medicines (Rx & OTC)</option>
            <option value="REQUIRED">Prescription Required Only</option>
            <option value="OTC">OTC / No Rx Needed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="newest">Sort: Newest Added</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <span className="font-semibold text-slate-700">In-Stock Medicines Only</span>
          </label>

          <span className="text-slate-500 font-medium">{filteredProducts.length} medicines available</span>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          Loading local pharmacy catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-900">No medicines found in this category</p>
          <p className="text-xs text-slate-500">Try selecting another category or clearing search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const isOutStock = p.is_active === false;
            const storeName = p.medical_stores?.store_name || 'Partner Pharmacy';
            const displayName = p.product_name || p.name || 'Medicine';
            const displayGeneric = p.generic_name || p.generic_composition || p.brand;
            const catMap = getCategoryMap(categories);
            const categoryName = p.product_categories?.name || catMap.get(p.category_id) || p.category;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm hover:shadow-soft-lg hover:border-brand-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Image Box */}
                  <Link href={`/products/${p.id}`} className="block">
                    <div className="w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden flex items-center justify-center">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={displayName} fill className="object-cover" />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}
                      {p.prescription_required && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-md shadow-xs">
                          Rx Required
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Pharmacy Source */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Store className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate font-semibold">{storeName}</span>
                  </div>

                  {/* Name & Composition */}
                  <div>
                    <Link href={`/products/${p.id}`}>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug hover:text-brand-600 transition-colors">
                        {displayName}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {displayGeneric}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {categoryName && (
                        <span className="inline-block text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md font-extrabold">
                          {categoryName}
                        </span>
                      )}
                      <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        {p.pack_size || 'Strip'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-black text-slate-900">₹{p.selling_price}</p>
                    {p.mrp && Number(p.mrp) > Number(p.selling_price) && (
                      <p className="text-[10px] text-slate-400 line-through">MRP ₹{p.mrp}</p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isOutStock}
                    onClick={() => addToCart(p, 1)}
                    leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                  >
                    {isOutStock ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <Suspense fallback={
        <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            Loading products catalog...
          </div>
        </main>
      }>
        <ProductsContent />
      </Suspense>
      <Footer />
      <MobileNavigation />
    </div>
  );
}
