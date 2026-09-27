import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/src/db';
import { prescriptions } from '@/src/db/medications';
import { getPatient } from '@/src/db/patient';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ patientId: string; id: string }> }) {
  try {
    const { patientId, id } = await params;
    const patient = await getPatient(patientId);
    if (!patient) return new NextResponse(null, { status: 404 });
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 400 });
    const [record] = await db.select().from(prescriptions).where(and(eq(prescriptions.id, id), eq(prescriptions.patientId, patient.id)));
    if (!record?.attachmentData) return new NextResponse(null, { status: 404 });
    return new NextResponse(Buffer.from(record.attachmentData, 'base64'), { headers: {
      'Content-Type': record.attachmentType!, 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(record.attachmentName!)}`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox",
    } });
  } catch { return new NextResponse(null, { status: 500 }); }
}
