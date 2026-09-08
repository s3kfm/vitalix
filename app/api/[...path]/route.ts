import { auth } from '@clerk/nextjs/server';
import { pool } from '../../../src/db';
import { measurementHandler } from '../../../src/server/measurements/http';
import { MeasurementService } from '../../../src/server/measurements/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const handler = measurementHandler(new MeasurementService(pool), async () => (await auth()).userId);
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
