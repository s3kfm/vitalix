import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { measurementDefinitions } from '@/src/db/measurements';
import { seedDefinitions } from '@/src/db/seed';

/**
 * GET /api/measurements/definitions
 * Returns the available measurement definition catalogue.
 * Seeds the catalogue first if empty.
 */
export async function GET() {
  try {
    await seedDefinitions();

    const defs = await db.select().from(measurementDefinitions);

    return NextResponse.json(defs);
  } catch (error) {
    console.error('GET /api/measurements/definitions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}