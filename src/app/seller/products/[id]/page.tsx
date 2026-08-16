'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Upload, Save, AlertCircle, CheckCircle2, DollarSign, ShieldAlert, Boxes } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories } from '@/lib/categories';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { sellerStore } = useAuth();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [genericComposition, setGenericComposition] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');
  
  const [packSize, setPackSize] = useState('');
  const [unitType, setUnitType] = useState('');

  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');
  const [usageInfo, setUsageInfo] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');

  const [stock, setStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Image Upload State
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProductAndCategories = useCallback(async () => {
    if (!sellerStore) return;
    setIsLoading(true);

    try {
      // 1. Fetch Categories
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);

      // 2. Fetch Product
      const { data: p, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('seller_store_id', sellerStore.id)
        .single();

      if (error || !p) {
        setErrorMessage('Product not found or unauthorized access.');
        setIsLoading(false);
        return;
      }

      setName(p.product_name || p.name || '');
      setBrand(p.brand || '');
      setGenericComposition(p.generic_name || p.generic_composition || '');
      setCategoryId(p.category_id || '');
      setManufacturer(p.manufacturer || '');
      setDescription(p.description || '');
      setPackSize(p.pack_size || '');
      setUnitType(p.unit_type || '');
      setMrp(String(p.mrp || ''));
      setSellingPrice(String(p.selling_price || ''));
      setPrescriptionRequired(p.prescription_required || false);
      setDosageForm(p.dosage_form || '');
      setStrength(p.strength || '');
      setUsageInfo(p.usage_info || '');
      setStorageInstructions(p.storage_instructions || '');
      setStock(String(p.stock || '0'));
      setReorderLevel(String(p.reorder_level || '10'));
      setStatus(p.is_active !== undefined ? (p.is_active ? 'ACTIVE' : 'INACTIVE') : (p.status || 'ACTIVE'));
      setCurrentImageUrl(p.image_url || null);
    } catch {
      setErrorMessage('Error fetching product information.');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, sellerStore, supabase]);

  useEffect(() => {
    fetchProductAndCategories();
  }, [fetchProductAndCategories]);

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be under 5 MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerStore) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Category Validation
    if (!categoryId || categoryId.trim() === '') {
      setErrorMessage('Please select a product category.');
      setIsSaving(false);
      return;
    }

    const mrpNum = Number(mrp);
    const priceNum = Number(sellingPrice);
    const stockNum = Number(stock);
    const reorderNum = Number(reorderLevel);

    if (priceNum > mrpNum) {
      setErrorMessage('Selling price cannot exceed Maximum Retail Price (MRP).');
      setIsSaving(false);
      return;
    }

    try {
      let imageUrl = currentImageUrl;

      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${sellerStore.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('medirush-products')
          .upload(fileName, imageFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('medirush-products')
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        }
      }

      const discountPct = mrpNum > 0 ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          category_id: categoryId,
          product_name: name,
          brand,
          generic_name: genericComposition || null,
          manufacturer,
          description,
          image_url: imageUrl,
          pack_size: packSize,
          mrp: mrpNum,
          selling_price: priceNum,
          prescription_required: prescriptionRequired,
          dosage_form: dosageForm,
          strength,
          is_active: status === 'ACTIVE',
        })
        .eq('id', params.id)
        .eq('seller_store_id', sellerStore.id);

      if (updateError) {
        setErrorMessage(updateError.message || 'Failed to update product details.');
      } else {
        setSuccessMessage('Product updated successfully!');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while updating the product.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading product details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/seller/products">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Catalog
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Medicine Product</h1>
          <p className="text-xs text-slate-500">Update product composition, prices, stock levels, or status</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        
        {/* Section 1: Basic Medicine Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-600" />
            <span>1. Basic Medicine Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Trade / Brand Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Manufacturer / Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Generic Active Composition" value={genericComposition} onChange={(e) => setGenericComposition(e.target.value)} required />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-700">Product Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 min-h-[44px]"
                required
              >
                <option value="">-- Select Product Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-700">Product Description & Uses</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Packaging */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            <span>2. Pricing & Packaging</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Maximum Retail Price (MRP ₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} required />
            <Input label="MediRush Selling Price (₹)" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Pack Size Description" value={packSize} onChange={(e) => setPackSize(e.target.value)} required />
            <Input label="Unit Type" value={unitType} onChange={(e) => setUnitType(e.target.value)} required />
          </div>
        </div>

        {/* Section 3: Medical Compliance & Stock */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-600" />
            <span>3. Medical Compliance & Current Stock</span>
          </h3>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Prescription Required</p>
              <p className="text-[11px] text-slate-500">Require prescription upload at checkout</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prescriptionRequired}
                onChange={(e) => setPrescriptionRequired(e.target.checked)}
                className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-slate-800">Rx Required</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Available Stock Quantity" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <Input label="Low-Stock Reorder Threshold" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} required />
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-700">Product Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 min-h-[44px]"
              >
                <option value="ACTIVE">ACTIVE (Visible in Store)</option>
                <option value="INACTIVE">INACTIVE (Hidden from Customers)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Image Update */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            4. Product Image
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : currentImageUrl ? (
                <Image src={currentImageUrl} alt="Current Image" fill className="object-cover" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Select a new file to replace the existing product image</p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Changes
        </Button>
      </form>
    </div>
  );
}
