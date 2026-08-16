'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createAuditLog } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';
import { fetchProductCategories } from '@/lib/categories';

export default function AdminCategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProductCategories(supabase);
      if (data) setCategories(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase
      .from('product_categories')
      .insert({ name: newCatName, slug })
      .select()
      .single();

    if (data) {
      await createAuditLog('CATEGORY_CREATE', 'PRODUCT_CATEGORY', data.id);
      setNewCatName('');
      setNewCatSlug('');
      setIsAdding(false);
      await fetchCategories();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Medicine & Healthcare Categories</h1>
          <p className="text-xs text-slate-500">Manage categories used across local pharmacy medicine listings</p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Add Category'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCategory} className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-soft-sm text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Create New Product Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Cardiac Care" required />
            <Input label="Category Slug" value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} placeholder="e.g. cardiac-care" />
          </div>
          <Button variant="primary" size="sm" type="submit">
            Save Category
          </Button>
        </form>
      )}

      {/* Categories Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-soft-sm space-y-3 text-xs">
        {isLoading ? (
          <p className="text-center text-slate-400 py-8">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No categories found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-bold text-slate-900">{c.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">/{c.slug}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
