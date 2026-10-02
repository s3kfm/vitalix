import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, getTableColumns } from 'drizzle-orm';
import { ValidationError } from 'yup';
import { db } from '@/src/db';
import { prescriptions } from '@/src/db/medications';
import { requirePatient } from '@/src/lib/api/patient';
import { prescriptionSchema } from '@/src/lib/validations/medications';
type Context = { params: Promise<{ patientId: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const columns = getTableColumns(prescriptions);
    const { attachmentData: _data, ...publicColumns } = columns;
    void _data;
    return NextResponse.json(
      await db
        .select(publicColumns)
        .from(prescriptions)
        .where(eq(prescriptions.patientId, patient.id))
        .orderBy(desc(prescriptions.issuedOn)),
    );
  } catch {
    return NextResponse.json({ error: 'Could not load prescriptions.' }, { status: 500 });
  }
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const found = await requirePatient(params);
    if (!found.ok) return found.response;
    const { patient } = found;
    const form = await request.formData();
    const data = await prescriptionSchema.validate(JSON.parse(String(form.get('record'))), {
      stripUnknown: true,
    });
    const file = form.get('attachment');
    let attachment = {};
    if (file instanceof File && file.size) {
      if (
        file.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
      )
        return NextResponse.json(
          { error: 'Choose a JPG, PNG or PDF up to 5 MB.' },
          { status: 400 },
        );
      const bytes = Buffer.from(await file.arrayBuffer());
      const valid =
        file.type === 'application/pdf'
          ? bytes.subarray(0, 5).toString() === '%PDF-'
          : file.type === 'image/png'
            ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid)
        return NextResponse.json(
          { error: 'File contents do not match the selected file type.' },
          { status: 400 },
        );
      attachment = {
        attachmentName: file.name.slice(0, 200),
        attachmentType: file.type,
        attachmentData: bytes.toString('base64'),
      };
    }
    const [record] = await db
      .insert(prescriptions)
      .values({ ...data, ...attachment, patientId: patient.id })
      .returning({ id: prescriptions.id });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError || e instanceof SyntaxError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: 'Could not save prescription.' }, { status: 500 });
  }
}
