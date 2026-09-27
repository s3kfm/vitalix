import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { CycleObservationNotFound } from './service';

export function cycleApiError(error: unknown) {
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof CycleObservationNotFound)
    return NextResponse.json({ error: 'Observation not found.' }, { status: 404 });
  console.error('Cycle API:', error);
  return NextResponse.json({ error: 'Could not process cycle tracking request.' }, { status: 500 });
}
