import { NextResponse } from 'next/server';
import { ensureAdminAccountExists } from '@/lib/supabase/admin-init';

export async function GET() {
  const result = await ensureAdminAccountExists();
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}

export async function POST() {
  const result = await ensureAdminAccountExists();
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}
