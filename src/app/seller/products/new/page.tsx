'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Upload, Plus, AlertCircle, CheckCircle2, FileText, DollarSign, ShieldAlert, Boxes } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories } from '@/lib/categories';

export default function AddProductPage() {
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
  
  const [packSize, setPackSize] = useState('10 Tablets / Strip');
  const [unitType, setUnitType] = useState('Strip');
  const [sku, setSku] = useState('');

  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [taxPercent, setTaxPercent] = useState('12');

  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('500 mg');
  const [usageInfo, setUsageInfo] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('Store in a cool & dry place below 25°C');

  const [batchNumber, setBatchNumber] = useState(`BATCH-${Date.now().toString().substring(6)}`);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Default Expiry 1 year in future
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const [expiryDate, setExpiryDate] = useState(nextYear.toISOString().split('T')[0]);

  const [stock, setStock] = useState('100');
  const [reorderLevel, setReorderLevel] = useState('15');

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      const catData = await fetchProductCategories(supabase);
      setCategories(catData);
    };
    fetchCats();
  }, [supabase]);

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

    setIsLoading(true);
    setErrorMessage(null);

    // Category Validation
    if (!categoryId || categoryId.trim() === '') {
      setErrorMessage('Please select a product category.');
      setIsLoading(false);
      return;
    }

    // Validation
    const mrpNum = Number(mrp);
    const priceNum = Number(sellingPrice);
    const stockNum = Number(stock);
    const reorderNum = Number(reorderLevel);

    if (priceNum > mrpNum) {
      setErrorMessage('Selling price cannot exceed the Maximum Retail Price (MRP).');
      setIsLoading(false);
      return;
    }

    if (new Date(mfgDate) >= new Date(expiryDate)) {
      setErrorMessage('Manufacturing date must be prior to Expiry date.');
      setIsLoading(false);
      return;
    }

    if (new Date(expiryDate) <= new Date()) {
      setErrorMessage('Expiry date must be a future date for new medicine stock.');
      setIsLoading(false);
      return;
    }

    try {
      let imageUrl = null;

      // 1. Upload Product Image if provided
      if (imageFile) {
        setIsUploadingImage(true);
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
        setIsUploadingImage(false);
      }

      // Calculate Discount Percentage
      const discountPct = mrpNum > 0 ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

      // 2. Insert Product
      const prodSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
      const { data: newProd, error: prodError } = await supabase
        .from('products')
        .insert({
          seller_store_id: sellerStore.id,
          category_id: categoryId,
          product_name: name,
          slug: prodSlug,
          brand,
          generic_name: genericComposition || null,
          manufacturer: manufacturer || null,
          description: description || null,
          image_url: imageUrl || null,
          pack_size: packSize,
          mrp: mrpNum,
          selling_price: priceNum,
          prescription_required: prescriptionRequired,
          dosage_form: dosageForm || null,
          strength: strength || null,
          is_active: true,
        })
        .select()
        .single();

      if (prodError || !newProd) {
        setErrorMessage(prodError?.message || 'Failed to create medicine product.');
        setIsLoading(false);
        return;
      }

      // 3. Insert Initial Batch Record in product_batches
      if (batchNumber && mfgDate && expiryDate) {
        await supabase.from('product_batches').insert({
          product_id: newProd.id,
          batch_number: batchNumber,
          manufacturing_date: mfgDate,
          expiry_date: expiryDate,
          quantity: stockNum || 50,
          selling_price: priceNum,
          status: 'ACTIVE',
        });
      }

      router.push('/seller/products');
    } catch {
      setErrorMessage('An unexpected error occurred while saving the product.');
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-extrabold text-slate-900">Add New Medicine Product</h1>
          <p className="text-xs text-slate-500">Fill in medical composition, MRP, selling price, and initial batch details</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
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
            <Input
              label="Product Trade / Brand Name"
              placeholder="Crocin Advance 500mg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Manufacturer / Brand"
              placeholder="GlaxoSmithKline (GSK)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Generic Active Composition"
              placeholder="Paracetamol / Acetaminophen 500mg"
              value={genericComposition}
              onChange={(e) => setGenericComposition(e.target.value)}
              required
            />

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
              placeholder="Fast relief from fever, body ache, and mild to moderate headache..."
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Maximum Retail Price (MRP ₹)"
              type="number"
              placeholder="30.00"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              required
            />
            <Input
              label="MediRush Selling Price (₹)"
              type="number"
              placeholder="25.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
            <Input
              label="Applicable GST Tax %"
              type="number"
              placeholder="12"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Pack Size Description"
              placeholder="15 Tablets / Strip"
              value={packSize}
              onChange={(e) => setPackSize(e.target.value)}
              required
            />
            <Input
              label="Unit Type"
              placeholder="Strip / Bottle / Box"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              required
            />
            <Input
              label="SKU Code (Optional)"
              placeholder="SKU-CRO-500"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Medical Compliance */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-600" />
            <span>3. Medical Compliance & Dosage</span>
          </h3>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Prescription Required (Schedule H / H1 / X)</p>
              <p className="text-[11px] text-slate-500">Require customer to upload valid doctor&apos;s prescription</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Dosage Form" placeholder="Tablet / Capsule / Syrup / Ointment" value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} />
            <Input label="Strength" placeholder="500 mg / 10 ml" value={strength} onChange={(e) => setStrength(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Usage Instructions" placeholder="Take 1 tablet after meals" value={usageInfo} onChange={(e) => setUsageInfo(e.target.value)} />
            <Input label="Storage Instructions" placeholder="Store below 25°C" value={storageInstructions} onChange={(e) => setStorageInstructions(e.target.value)} />
          </div>
        </div>

        {/* Section 4: Initial Batch & Inventory */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-brand-600" />
            <span>4. Initial Batch & Stock Quantity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Batch Number" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
            <Input label="Manufacturing Date" type="date" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} required />
            <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Available Initial Quantity" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
            <Input label="Low-Stock Reorder Threshold" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} required />
          </div>
        </div>

        {/* Section 5: Image Upload */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            5. Product Image Upload
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
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
              <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP under 5 MB</p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Medicine Product to Store
        </Button>
      </form>
    </div>
  );
}
