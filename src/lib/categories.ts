export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const PRODUCT_CATEGORIES: CategoryItem[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Tablet', slug: 'tablet', description: 'Solid oral dosage form medicines' },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Capsule', slug: 'capsule', description: 'Gelatin shell encapsulated medication' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Syrup', slug: 'syrup', description: 'Liquid oral medication in sugar solution' },
  { id: 'c0000000-0000-0000-0000-000000000004', name: 'Suspension', slug: 'suspension', description: 'Heterogeneous liquid mixture containing solid particles' },
  { id: 'c0000000-0000-0000-0000-000000000005', name: 'Injection', slug: 'injection', description: 'Sterile injectable solution or powder' },
  { id: 'c0000000-0000-0000-0000-000000000006', name: 'Cream', slug: 'cream', description: 'Semisolid topical emulsion' },
  { id: 'c0000000-0000-0000-0000-000000000007', name: 'Ointment', slug: 'ointment', description: 'Oil-based topical formulation' },
  { id: 'c0000000-0000-0000-0000-000000000008', name: 'Gel', slug: 'gel', description: 'Clear or translucent topical gel' },
  { id: 'c0000000-0000-0000-0000-000000000009', name: 'Lotion', slug: 'lotion', description: 'Low-viscosity topical preparation' },
  { id: 'c0000000-0000-0000-0000-000000000010', name: 'Drops', slug: 'drops', description: 'Eye, ear, or nasal drop solutions' },
  { id: 'c0000000-0000-0000-0000-000000000011', name: 'Spray', slug: 'spray', description: 'Nasal or topical aerosol/pump spray' },
  { id: 'c0000000-0000-0000-0000-000000000012', name: 'Inhaler', slug: 'inhaler', description: 'Respiratory asthma and COPD inhalers' },
  { id: 'c0000000-0000-0000-0000-000000000013', name: 'Powder', slug: 'powder', description: 'Oral or topical medicinal powders' },
  { id: 'c0000000-0000-0000-0000-000000000014', name: 'Sachet', slug: 'sachet', description: 'Single-use powder or granule packets' },
  { id: 'c0000000-0000-0000-0000-000000000015', name: 'Solution', slug: 'solution', description: 'Homogeneous liquid medicinal preparations' },
  { id: 'c0000000-0000-0000-0000-000000000016', name: 'Suppository', slug: 'suppository', description: 'Rectal or vaginal suppositories' },
  { id: 'c0000000-0000-0000-0000-000000000017', name: 'Medical Device', slug: 'medical-device', description: 'Thermometers, pulse oximeters, BP monitors' },
  { id: 'c0000000-0000-0000-0000-000000000018', name: 'Surgical Supply', slug: 'surgical-supply', description: 'Bandages, cotton, syringes, surgical tape' },
  { id: 'c0000000-0000-0000-0000-000000000019', name: 'Personal Care', slug: 'personal-care', description: 'Hygiene, skincare, and wellness products' },
  { id: 'c0000000-0000-0000-0000-000000000020', name: 'Other', slug: 'other', description: 'Miscellaneous pharmaceutical products' },
];

/**
 * Fetches categories from Supabase product_categories table.
 * If table is empty or query returns 0 rows, attempts to seed default categories or returns PRODUCT_CATEGORIES fallback.
 */
export async function fetchProductCategories(supabase: any): Promise<CategoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }

    // If table is empty, attempt to seed default categories
    if (data && data.length === 0) {
      await supabase.from('product_categories').upsert(
        PRODUCT_CATEGORIES.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          is_active: true,
        })),
        { onConflict: 'name' }
      );

      const { data: seededData } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });

      if (seededData && seededData.length > 0) {
        return seededData;
      }
    }
  } catch {
    // Fallback to default categories if network/database fails
  }

  return PRODUCT_CATEGORIES;
}

/**
 * Returns a Map of category ID -> Category name for fast lookup
 */
export function getCategoryMap(categories: CategoryItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of PRODUCT_CATEGORIES) {
    map.set(cat.id, cat.name);
    map.set(cat.name.toLowerCase(), cat.name);
  }
  for (const cat of categories) {
    map.set(cat.id, cat.name);
    map.set(cat.name.toLowerCase(), cat.name);
  }
  return map;
}
