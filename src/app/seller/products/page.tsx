'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Filter, ArrowUpDown, Edit, Trash2, Eye, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Package } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories, getCategoryMap } from '@/lib/categories';

export default function SellerProductsPage() {
  const { sellerStore } = useAuth();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [rxFilter, setRxFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProductsAndCategories = useCallback(async () => {
    if (!sellerStore) return;
    setIsLoading(true);

    try {
      // 1. Fetch Categories
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);

      // 2. Fetch Seller's Products with category relation
      const { data: prodData } = await supabase
        .from('products')
        .select('*, product_categories(id, name, slug)')
        .eq('seller_store_id', sellerStore.id)
        .order('created_at', { ascending: false });

      if (prodData) setProducts(prodData);
    } catch {
      // Fallback handling
    } finally {
      setIsLoading(false);
    }
  }, [sellerStore, supabase]);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (id: string, currentIsActive: boolean) => {
    await supabase.from('products').update({ is_active: !currentIsActive }).eq('id', id);
    await fetchProductsAndCategories();
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this medicine product?')) {
      await supabase.from('products').delete().eq('id', id);
      await fetchProductsAndCategories();
    }
  };

  // Filter & Sort Logic
  const filteredProducts = products.filter((p) => {
    const prodName = p.product_name || p.name || '';
    const genName = p.generic_name || p.generic_composition || '';
    const isActive = p.is_active !== undefined ? p.is_active : p.status === 'ACTIVE';

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = prodName.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchGeneric = genName.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchGeneric) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && p.category_id !== selectedCategory) return false;

    // Prescription Filter
    if (rxFilter === 'REQUIRED' && !p.prescription_required) return false;
    if (rxFilter === 'NOT_REQUIRED' && p.prescription_required) return false;

    // Active Status Filter
    if (statusFilter === 'ACTIVE' && !isActive) return false;
    if (statusFilter === 'INACTIVE' && isActive) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_low') return Number(a.selling_price) - Number(b.selling_price);
    if (sortBy === 'price_high') return Number(b.selling_price) - Number(a.selling_price);
    if (sortBy === 'stock_low') return Number(a.stock || 0) - Number(b.stock || 0);
    if (sortBy === 'stock_high') return Number(b.stock || 0) - Number(a.stock || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Medicine Products Catalog</h1>
          <p className="text-sm text-slate-500">Manage pharmacy inventory, prices, discounts, and prescription flags</p>
        </div>

        <Link href="/seller/products/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-soft-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <Input
            placeholder="Search medicine, brand, generic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock (≤ Reorder Level)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

          {/* Rx Filter */}
          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-500 min-h-[42px]"
          >
            <option value="ALL">All Prescription Flags</option>
            <option value="REQUIRED">Rx Required Only</option>
            <option value="NOT_REQUIRED">OTC / No Rx Needed</option>
          </select>

        </div>

        {/* Secondary Bar: Status & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Filter Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                statusFilter === 'INACTIVE' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 focus:outline-none"
            >
              <option value="newest">Newest Added</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="stock_low">Stock: Low to High</option>
              <option value="stock_high">Stock: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading pharmacy products catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No products found matching filters</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first medicine product or clear filter criteria to see your active store catalog.
            </p>
            <Link href="/seller/products/new" className="inline-block pt-2">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Medicine Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Pack Size</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Rx Flag</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((p) => {
                  const isActive = p.is_active !== undefined ? p.is_active : p.status === 'ACTIVE';
                  const displayName = p.product_name || p.name || 'Medicine';
                  const displayGeneric = p.generic_name || p.generic_composition;
                  const catMap = getCategoryMap(categories);
                  const categoryName = p.product_categories?.name || catMap.get(p.category_id) || 'Uncategorized';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Medicine Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden shrink-0 flex items-center justify-center">
                            {p.image_url ? (
                              <Image src={p.image_url} alt={displayName} fill className="object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{displayName}</p>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {p.brand} {displayGeneric ? `• ${displayGeneric}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] border border-slate-200">
                          {categoryName}
                        </span>
                      </td>

                      {/* Pack Size */}
                      <td className="py-4 px-4 font-medium text-slate-700">{p.pack_size || 'Strip / Bottle'}</td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">₹{p.selling_price}</p>
                          {p.mrp && Number(p.mrp) > Number(p.selling_price) && (
                            <p className="text-[10px] text-slate-400 line-through">MRP ₹{p.mrp}</p>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-4">
                        <span
                          className={`font-extrabold px-2.5 py-1 rounded-full text-[11px] ${
                            !isActive
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Rx Flag */}
                      <td className="py-4 px-4">
                        {p.prescription_required ? (
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 text-[10px]">
                            Rx Required
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            OTC
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(p.id, isActive)}
                          className={`font-bold px-2.5 py-1 rounded-full text-[10px] uppercase transition-all ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/seller/products/${p.id}`}>
                            <button className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit Product">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
