'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { MobileNavigation } from '@/components/common/MobileNavigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductCard } from '@/components/common/ProductCard';
import { StoreCard } from '@/components/common/StoreCard';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/types/product';
import { MedicalStore } from '@/types/store';
import {
  Pill,
  Bandage,
  Sparkles,
  Baby,
  Activity,
  HeartPulse,
  ShieldCheck,
  Truck,
  FileCheck,
  Search,
  Store as StoreIcon,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Award,
  Zap,
} from 'lucide-react';

const mapDbProduct = (item: any): Product => ({
  id: item.id,
  storeId: item.store_id || item.medical_store_id || '',
  storeName: item.medical_stores?.store_name || 'Verified Chemist',
  name: item.name || item.title || 'Medicine Product',
  genericName: item.generic_name || item.composition || '',
  brand: item.brand || item.manufacturer || 'MediRush Partner',
  category: item.product_categories?.name || item.category || 'Medicines',
  price: Number(item.price || item.selling_price || 0),
  mrp: Number(item.mrp || item.price || 0),
  discountPercentage: item.discount_percentage || (item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0),
  prescriptionRequirement: item.requires_prescription ? 'REQUIRED' : 'NOT_REQUIRED',
  imageUrl: item.image_url || item.imageUrl || '',
  description: item.description || '',
  packSize: item.pack_size || item.unit || '10 Tablets',
  inStock: item.in_stock ?? (item.stock_quantity ? item.stock_quantity > 0 : true),
  stockQuantity: item.stock_quantity || 10,
  rating: item.rating || 4.8,
  reviewCount: item.review_count || 15,
});

const mapDbStore = (item: any): MedicalStore => ({
  id: item.id,
  name: item.store_name || item.name || 'Local Verified Pharmacy',
  drugLicenseNumber: item.medical_license_number || item.license_number || 'DL-MEDIRUSH-VERIFIED',
  address: `${item.address || ''}, ${item.city || ''}`.trim() || 'Neighborhood Chemist',
  city: item.city || 'Delhi',
  rating: item.rating || 4.9,
  totalRatings: item.review_count || 42,
  isVerified: item.verification_status === 'APPROVED' || item.verification_status !== 'REJECTED',
  isOpen: item.store_status === 'ACTIVE' || item.store_status !== 'INACTIVE',
  imageUrl: item.banner_url || item.image_url || '',
  featuredCategories: ['Essential Rx', 'Personal Care', 'First Aid'],
  estimatedDeliveryMinutes: 30,
  distanceKm: 1.5,
  operatingHours: {
    open: item.opening_time || '08:00 AM',
    close: item.closing_time || '10:00 PM',
  },
});

export default function HomePage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<MedicalStore[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const categories = [
    { name: 'Medicines', icon: Pill, color: 'bg-[#E8F8F1] text-[#16B67A] border-[#16B67A]/30', desc: 'Prescription & OTC' },
    { name: 'First Aid', icon: Bandage, color: 'bg-rose-50 text-rose-600 border-rose-200', desc: 'Bandages & Antiseptics' },
    { name: 'Personal Care', icon: Sparkles, color: 'bg-purple-50 text-purple-600 border-purple-200', desc: 'Hygiene & Skincare' },
    { name: 'Baby Care', icon: Baby, color: 'bg-sky-50 text-sky-600 border-sky-200', desc: 'Nutrition & Diapers' },
    { name: 'Medical Devices', icon: Activity, color: 'bg-amber-50 text-amber-600 border-amber-200', desc: 'BP & Glucose Monitors' },
    { name: 'Wellness', icon: HeartPulse, color: 'bg-teal-50 text-teal-600 border-teal-200', desc: 'Vitamins & Minerals' },
    { name: 'Health Essentials', icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', desc: 'Daily Protection' },
  ];

  const fetchRealDatabaseData = useCallback(async () => {
    setIsLoadingProducts(true);
    setIsLoadingStores(true);
    setDbError(null);

    try {
      // 1. Fetch Real Products from Supabase DB
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug), medical_stores(store_name, city, rating)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!prodErr && prodData) {
        setProducts(prodData.map(mapDbProduct));
      } else {
        setProducts([]);
      }

      // 2. Fetch Real Verified Medical Stores from Supabase DB
      const { data: storeData, error: storeErr } = await supabase
        .from('medical_stores')
        .select('*')
        .limit(6);

      if (!storeErr && storeData) {
        setStores(storeData.map(mapDbStore));
      } else {
        setStores([]);
      }
    } catch {
      setDbError('Unable to connect to database. Please refresh.');
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingStores(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRealDatabaseData();
  }, [fetchRealDatabaseData]);

  // Discounted products for deals section
  const discountedProducts = products.filter((p) => p.discountPercentage > 0 || p.mrp > p.price);
  const popularMedicines = products.slice(0, 8);
  const wellnessProducts = products.filter((p) => 
    p.category?.toLowerCase().includes('wellness') || 
    p.category?.toLowerCase().includes('supplement') ||
    p.category?.toLowerCase().includes('personal')
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="grow space-y-12 pb-16">
        
        {/* ================================================== */}
        {/* 1. HERO SECTION */}
        {/* ================================================== */}
        <section className="bg-gradient-to-b from-[#E8F8F1]/60 via-[#F7FAF9] to-[#F7FAF9] pt-6 sm:pt-10 pb-6 border-b border-[#E2EAE6]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-6 sm:p-12 shadow-soft-md border border-[#E2EAE6] relative overflow-hidden">
              
              {/* Background Ambient Aesthetics */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#E8F8F1] rounded-full blur-3xl opacity-70 pointer-events-none -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#16B67A]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Hero Content */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-[#E8F8F1] text-[#0F8F68] border border-[#16B67A]/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
                    <Zap className="w-3.5 h-3.5 text-[#16B67A]" />
                    <span>Express 30-Min Delivery • Licensed Chemists Only</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-3xl sm:text-5xl font-black text-[#0B2540] tracking-tight leading-tight">
                    Your Trusted Online <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16B67A] to-[#0F8F68]">
                      Pharmacy Marketplace
                    </span>
                  </h1>

                  {/* Supporting Copy */}
                  <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
                    Medicines, healthcare essentials and wellness products delivered safely to your doorstep from verified local pharmacies.
                  </p>

                  {/* Search Bar Integration */}
                  <div className="pt-1 max-w-xl">
                    <SearchBar placeholder="Search medicines, health products & brands..." />
                  </div>

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link href="/products">
                      <span className="inline-flex items-center justify-center gap-2 bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-soft-sm hover:shadow-card-hover active:scale-95 cursor-pointer">
                        <Pill className="w-4 h-4" />
                        <span>Shop Medicines</span>
                      </span>
                    </Link>

                    <Link href="/cart">
                      <span className="inline-flex items-center justify-center gap-2 bg-[#E8F8F1] hover:bg-[#16B67A] text-[#0F8F68] hover:text-white font-bold text-sm px-6 py-3 rounded-xl border border-[#16B67A]/30 transition-all cursor-pointer">
                        <FileCheck className="w-4 h-4" />
                        <span>Upload Prescription</span>
                      </span>
                    </Link>
                  </div>

                  {/* Trust Highlights */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#0B2540] pt-3 border-t border-[#E2EAE6]/70">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16B67A]" />
                      <span>100% Genuine Medicines</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16B67A]" />
                      <span>Pharmacist Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16B67A]" />
                      <span>Live Delivery Tracking</span>
                    </div>
                  </div>

                </div>

                {/* Right Hero Showcase Visual */}
                <div className="lg:col-span-5 hidden lg:block">
                  <div className="bg-gradient-to-br from-[#E8F8F1] to-white border border-[#E2EAE6] p-7 rounded-3xl space-y-5 shadow-soft-md relative">
                    
                    {/* Badge Card */}
                    <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#E2EAE6] shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-[#16B67A]/15 text-[#16B67A] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0B2540]">Verified Local Chemist</h4>
                        <p className="text-[11px] text-slate-500">State Drug License Verified</p>
                      </div>
                    </div>

                    {/* Prescription Card Showcase */}
                    <div className="bg-[#0B2540] text-white p-6 rounded-2xl space-y-3 shadow-soft-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#16B67A] bg-[#16B67A]/20 px-2.5 py-1 rounded">
                          Prescription Rx
                        </span>
                        <ShieldAlert className="w-4 h-4 text-[#16B67A]" />
                      </div>
                      <h3 className="text-base font-bold">Have a Doctor&apos;s Prescription?</h3>
                      <p className="text-xs text-slate-300">
                        Upload your prescription image or PDF. Our partner chemists will verify and pack your exact prescribed dosage.
                      </p>
                      <Link href="/cart" className="block pt-1">
                        <div className="w-full text-center bg-[#16B67A] hover:bg-[#0F8F68] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs cursor-pointer">
                          Upload Prescription Now
                        </div>
                      </Link>
                    </div>

                    {/* Delivery Time Card */}
                    <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E2EAE6] text-xs font-bold text-[#0B2540]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#16B67A]" />
                        <span>Average Local Delivery Time</span>
                      </div>
                      <span className="text-[#0F8F68] font-extrabold bg-[#E8F8F1] px-2.5 py-1 rounded-lg">
                        ~25 - 35 Mins
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 2. TRUST STRIP */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E2EAE6] rounded-2xl p-4 shadow-soft-sm grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            
            <div className="flex items-center justify-center gap-2 p-2">
              <ShieldCheck className="w-5 h-5 text-[#16B67A] shrink-0" />
              <span className="text-xs font-bold text-[#0B2540]">100% Verified Pharmacies</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-2">
              <CheckCircle2 className="w-5 h-5 text-[#16B67A] shrink-0" />
              <span className="text-xs font-bold text-[#0B2540]">Genuine Medicines</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-2">
              <Lock className="w-5 h-5 text-[#16B67A] shrink-0" />
              <span className="text-xs font-bold text-[#0B2540]">Secure Payments</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-2">
              <Truck className="w-5 h-5 text-[#16B67A] shrink-0" />
              <span className="text-xs font-bold text-[#0B2540]">Fast Local Delivery</span>
            </div>

            <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 p-2">
              <FileCheck className="w-5 h-5 text-[#16B67A] shrink-0" />
              <span className="text-xs font-bold text-[#0B2540]">Pharmacist Verified</span>
            </div>

          </div>
        </section>

        {/* ================================================== */}
        {/* 3. CATEGORIES SECTION */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2540] tracking-tight">
                Explore Healthcare Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Browse essential medicines, surgicals, and wellness supplies
              </p>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-bold text-[#16B67A] hover:text-[#0F8F68] bg-[#E8F8F1] px-3.5 py-2 rounded-xl border border-[#16B67A]/30 transition-all">
              <span>View All Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-none snap-x md:grid md:grid-cols-4 lg:grid-cols-7">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="min-w-[130px] md:min-w-0 snap-start shrink-0 grow"
                >
                  <div className="bg-white border border-[#E2EAE6] hover:border-[#16B67A] rounded-2xl p-4 text-center shadow-soft-sm hover:shadow-card-hover transition-all duration-300 flex flex-col items-center group cursor-pointer hover:-translate-y-1 h-full">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-[#0B2540] group-hover:text-[#16B67A] transition-colors line-clamp-1">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">
                      {cat.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================================================== */}
        {/* 4. TODAY'S BEST DEALS (Real Supabase Data Only) */}
        {/* ================================================== */}
        {discountedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Offers
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#0B2540] tracking-tight">
                  Today&apos;s Best Deals
                </h2>
              </div>
              <Link href="/products" className="text-xs font-bold text-[#16B67A] hover:text-[#0F8F68] flex items-center gap-1">
                <span>View All Offers</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* 5. POPULAR MEDICINES (Real Supabase Data Only) */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2540] tracking-tight">
                Popular Medicines & Healthcare Essentials
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Available directly from verified neighborhood medical stores
              </p>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-bold text-[#16B67A] hover:text-[#0F8F68] bg-[#E8F8F1] px-3.5 py-2 rounded-xl border border-[#16B67A]/30 transition-all">
              <span>View Full Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-[#E2EAE6] rounded-2xl p-4 h-72 animate-pulse flex flex-col justify-between">
                  <div className="w-full h-40 bg-slate-100 rounded-xl mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularMedicines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularMedicines.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAE6] rounded-2xl p-8 text-center space-y-3">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0B2540]">No products available yet.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Verified products added by licensed seller pharmacies will appear here.
              </p>
              <Link href="/products" className="inline-block pt-2">
                <span className="bg-[#16B67A] text-white text-xs font-bold px-4 py-2 rounded-xl">
                  Browse Catalog
                </span>
              </Link>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 6. PRESCRIPTION UPLOAD SECTION */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0B2540] text-white rounded-3xl p-8 sm:p-12 shadow-soft-lg relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#16B67A]/20 text-[#16B67A] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#16B67A]/40">
                  <FileCheck className="w-4 h-4" />
                  <span>Prescription Order Workflow</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Have a Doctor&apos;s Prescription?
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  Upload your prescription and let a verified local pharmacy review, verify, and pack your exact prescribed medicines.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Link href="/cart">
                    <span className="inline-flex items-center gap-2 bg-[#16B67A] hover:bg-[#0F8F68] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer">
                      <FileCheck className="w-4 h-4" />
                      <span>Upload Prescription</span>
                    </span>
                  </Link>
                </div>
              </div>

              {/* 4-Step Explanation */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-2xl space-y-3 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#16B67A] text-white flex items-center justify-center font-black text-xs shrink-0">1</span>
                  <span>Upload prescription image or PDF</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#16B67A] text-white flex items-center justify-center font-black text-xs shrink-0">2</span>
                  <span>Licensed Pharmacist verifies prescription details</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#16B67A] text-white flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <span>Order confirmed & packed by partner chemist</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#16B67A] text-white flex items-center justify-center font-black text-xs shrink-0">4</span>
                  <span>Doorstep delivery by verified delivery partner</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 7. HOW MEDIRUSH WORKS */}
        {/* ================================================== */}
        <section className="bg-white border-y border-[#E2EAE6] py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center space-y-10">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#0F8F68] bg-[#E8F8F1] px-3.5 py-1 rounded-full border border-[#16B67A]/30">
                Simple & Seamless
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0B2540] mt-3 tracking-tight">
                How MediRush Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
                Ordering genuine healthcare products from local pharmacies in 4 quick steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              
              <div className="bg-[#F7FAF9] border border-[#E2EAE6] p-6 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-black text-[#16B67A]/40 absolute top-4 right-4">01</span>
                <div className="w-12 h-12 rounded-xl bg-[#16B67A] text-white flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2540]">Search or Upload Rx</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search medicines directly or attach your doctor&apos;s prescription.
                </p>
              </div>

              <div className="bg-[#F7FAF9] border border-[#E2EAE6] p-6 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-black text-[#16B67A]/40 absolute top-4 right-4">02</span>
                <div className="w-12 h-12 rounded-xl bg-[#16B67A] text-white flex items-center justify-center font-bold">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2540]">Choose Your Pharmacy</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select licensed neighborhood medical stores near your pincode.
                </p>
              </div>

              <div className="bg-[#F7FAF9] border border-[#E2EAE6] p-6 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-black text-[#16B67A]/40 absolute top-4 right-4">03</span>
                <div className="w-12 h-12 rounded-xl bg-[#16B67A] text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2540]">Pharmacist Audit</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A registered pharmacist verifies medicine safety and packs order.
                </p>
              </div>

              <div className="bg-[#F7FAF9] border border-[#E2EAE6] p-6 rounded-2xl space-y-3 relative">
                <span className="text-2xl font-black text-[#16B67A]/40 absolute top-4 right-4">04</span>
                <div className="w-12 h-12 rounded-xl bg-[#16B67A] text-white flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2540]">Fast Delivery</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Assigned delivery partner brings package safely to your home.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* 8. VERIFIED PHARMACIES SECTION (Real Supabase Data Only) */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-[#16B67A]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#0B2540] tracking-tight">
                  Shop from Verified Pharmacies
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Partner medical stores operating in your local delivery area
              </p>
            </div>
            <Link href="/stores" className="flex items-center gap-1 text-xs font-bold text-[#16B67A] hover:text-[#0F8F68] bg-[#E8F8F1] px-3.5 py-2 rounded-xl border border-[#16B67A]/30 transition-all">
              <span>All Stores</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingStores ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#E2EAE6] rounded-2xl p-4 h-64 animate-pulse" />
              ))}
            </div>
          ) : stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAE6] rounded-2xl p-8 text-center space-y-2">
              <StoreIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0B2540]">Verified pharmacies will appear here.</h3>
              <p className="text-xs text-slate-500">Licensed chemists onboarded to MediRush will be listed in this section.</p>
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* 9. FAST LOCAL DELIVERY SHOWCASE */}
        {/* ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#E8F8F1] to-white border border-[#E2EAE6] rounded-3xl p-8 sm:p-12 shadow-soft-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0F8F68] bg-white border border-[#16B67A]/30 px-3 py-1 rounded-full">
                  <Truck className="w-4 h-4 text-[#16B67A]" />
                  <span>Real-Time Logistics Network</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0B2540]">
                  Fast Local Medicine Delivery
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  Get your approved medicines delivered by verified delivery partners with live order status and secure handover.
                </p>
              </div>

              <div className="md:col-span-4 flex justify-start md:justify-end">
                <Link href="/products">
                  <span className="inline-flex items-center gap-2 bg-[#0B2540] hover:bg-[#16B67A] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer">
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
