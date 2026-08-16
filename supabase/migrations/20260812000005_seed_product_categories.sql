-- Migration: Seed 20 Standard Product Categories
INSERT INTO public.product_categories (id, name, slug, description, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Tablet', 'tablet', 'Solid oral dosage form medicines', TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'Capsule', 'capsule', 'Gelatin shell encapsulated medication', TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'Syrup', 'syrup', 'Liquid oral medication in sugar solution', TRUE),
  ('c0000000-0000-0000-0000-000000000004', 'Suspension', 'suspension', 'Heterogeneous liquid mixture containing solid particles', TRUE),
  ('c0000000-0000-0000-0000-000000000005', 'Injection', 'injection', 'Sterile injectable solution or powder', TRUE),
  ('c0000000-0000-0000-0000-000000000006', 'Cream', 'cream', 'Semisolid topical emulsion', TRUE),
  ('c0000000-0000-0000-0000-000000000007', 'Ointment', 'ointment', 'Oil-based topical formulation', TRUE),
  ('c0000000-0000-0000-0000-000000000008', 'Gel', 'gel', 'Clear or translucent topical gel', TRUE),
  ('c0000000-0000-0000-0000-000000000009', 'Lotion', 'lotion', 'Low-viscosity topical preparation', TRUE),
  ('c0000000-0000-0000-0000-000000000010', 'Drops', 'drops', 'Eye, ear, or nasal drop solutions', TRUE),
  ('c0000000-0000-0000-0000-000000000011', 'Spray', 'spray', 'Nasal or topical aerosol/pump spray', TRUE),
  ('c0000000-0000-0000-0000-000000000012', 'Inhaler', 'inhaler', 'Respiratory asthma and COPD inhalers', TRUE),
  ('c0000000-0000-0000-0000-000000000013', 'Powder', 'powder', 'Oral or topical medicinal powders', TRUE),
  ('c0000000-0000-0000-0000-000000000014', 'Sachet', 'sachet', 'Single-use powder or granule packets', TRUE),
  ('c0000000-0000-0000-0000-000000000015', 'Solution', 'solution', 'Homogeneous liquid medicinal preparations', TRUE),
  ('c0000000-0000-0000-0000-000000000016', 'Suppository', 'suppository', 'Rectal or vaginal suppositories', TRUE),
  ('c0000000-0000-0000-0000-000000000017', 'Medical Device', 'medical-device', 'Thermometers, pulse oximeters, BP monitors', TRUE),
  ('c0000000-0000-0000-0000-000000000018', 'Surgical Supply', 'surgical-supply', 'Bandages, cotton, syringes, surgical tape', TRUE),
  ('c0000000-0000-0000-0000-000000000019', 'Personal Care', 'personal-care', 'Hygiene, skincare, and wellness products', TRUE),
  ('c0000000-0000-0000-0000-000000000020', 'Other', 'other', 'Miscellaneous pharmaceutical products', TRUE)
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  is_active = TRUE;
