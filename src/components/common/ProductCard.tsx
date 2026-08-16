'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Star, Store, ShieldAlert, Pill } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const discount = product.discountPercentage || 
    (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  const isRxRequired = product.prescriptionRequirement === 'REQUIRED';

  return (
    <div className="bg-white border border-[#E2EAE6] hover:border-[#16B67A] rounded-2xl p-4 shadow-soft-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      <div>
        {/* Product Image & Badges */}
        <div className="relative w-full h-44 bg-[#F7FAF9] rounded-xl overflow-hidden mb-3.5 flex items-center justify-center p-3 border border-[#E2EAE6]/50">
          {!imageError && product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              onError={() => setImageError(true)}
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
              <Pill className="w-10 h-10 text-[#16B67A]/40" />
              <span className="text-[10px] font-medium text-slate-400">MediRush</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
            {isRxRequired && (
              <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                <ShieldAlert className="w-3 h-3" />
                <span>Rx Required</span>
              </span>
            )}
            {discount > 0 && (
              <span className="bg-[#16B67A] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-[#0B2540]/60 uppercase tracking-wider text-[11px] truncate max-w-[140px]">
            {product.brand || 'MediRush Partner'}
          </span>
          <div className="flex items-center gap-1 text-amber-600 font-semibold text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-[#0B2540] group-hover:text-[#16B67A] transition-colors line-clamp-2 mb-1 min-h-[40px] leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Generic Composition Formula */}
        {product.genericName && (
          <p className="text-[11px] text-slate-500 truncate mb-1 italic">
            {product.genericName}
          </p>
        )}

        {/* Pack Size */}
        <p className="text-xs text-slate-400 mb-2.5 font-medium">{product.packSize || 'Standard Pack'}</p>

        {/* Verified Pharmacy Store Tag */}
        {product.storeName && (
          <div className="flex items-center gap-1.5 text-xs text-[#0B2540]/70 bg-[#E8F8F1]/60 px-2.5 py-1.5 rounded-lg mb-3 border border-[#E2EAE6]">
            <Store className="w-3.5 h-3.5 text-[#16B67A] shrink-0" />
            <span className="truncate font-semibold text-[11px]">{product.storeName}</span>
          </div>
        )}
      </div>

      {/* Pricing & CTA */}
      <div className="pt-2.5 border-t border-[#E2EAE6] flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-[#0B2540]">
              {formatCurrency(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => addToCart(product)}
          className="inline-flex items-center justify-center gap-1.5 bg-[#16B67A] hover:bg-[#0F8F68] active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all duration-200 shadow-soft-sm hover:shadow-card-hover cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};
