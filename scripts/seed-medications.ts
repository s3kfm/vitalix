/** Opt-in synthetic demo: DEMO_PATIENT_ID=<uuid> npm run db:seed:medications
 * Uses stable IDs and refuses to duplicate an existing demo. Never deletes records.
 */
import { loadEnvConfig } from '@next/env';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { localDay } from '../src/lib/medications/schedule';
loadEnvConfig(process.cwd());
async function main() {
  const patientId = process.env.DEMO_PATIENT_ID;
  if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId))
    throw new Error('Set DEMO_PATIENT_ID to an existing development patient UUID.');
  const { db, pool } = await import('../src/db');
  const { medications, medicationDoses, prescriptions, patients } =
    await import('../src/db/schema');
  const id = (key: string) => {
    const hex = createHash('sha256')
      .update(`vitalix-medication-demo/${patientId}/${key}`)
      .digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  };
  try {
    if (!(await db.select().from(patients).where(eq(patients.id, patientId))).length)
      throw new Error('Patient not found.');
    if (
      (
        await db
          .select()
          .from(medications)
          .where(eq(medications.id, id('statin')))
      ).length
    ) {
      console.log('Medication demo already exists; left existing records unchanged.');
      return;
    }
    const now = new Date();
    const today = localDay(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const past = localDay(yesterday);
    const when = (day: string, time: string) => new Date(`${day}T${time}:00`);
    const medicines = [
      {
        key: 'statin',
        name: 'Atorvastatin',
        strength: '20mg',
        dose: '1 tablet with water',
        schedule: ['08:00'],
        startDate: today,
      },
      {
        key: 'vitamin',
        name: 'Vitamin D3',
        strength: '2000 IU',
        dose: '1 drop with water',
        schedule: ['08:00'],
        startDate: today,
      },
      {
        key: 'coq',
        name: 'CoQ10',
        strength: '100mg',
        dose: '1 capsule with food',
        schedule: ['08:00'],
        startDate: today,
      },
      {
        key: 'afternoon',
        name: 'Probiotic Complex',
        strength: '',
        dose: '1 capsule',
        schedule: ['13:00'],
        startDate: today,
      },
      {
        key: 'evening',
        name: 'Evening supplement',
        strength: '',
        dose: '1 capsule with food',
        schedule: ['18:00', '22:00'],
        startDate: today,
      },
      {
        key: 'omega',
        name: 'Omega-3 Fish Oil',
        strength: '1000mg',
        dose: '1 softgel with dinner',
        schedule: ['20:00'],
        startDate: past,
      },
      {
        key: 'prn',
        name: 'Ibuprofen',
        strength: '400mg',
        dose: 'For mild headache or pain',
        schedule: [],
        notes: 'Max 3 doses per day',
        startDate: today,
      },
      {
        key: 'past',
        name: 'Completed treatment (demo)',
        strength: '',
        dose: '1 tablet',
        schedule: [],
        active: false,
        endedReason: 'Completed' as const,
        startDate: past,
        endDate: past,
      },
    ];
    await db.transaction(async (tx) => {
      await tx.insert(medications).values(
        medicines.map(({ key, ...m }) => ({
          ...m,
          id: id(key),
          patientId,
          code: { text: m.name },
          createdAt: when(m.startDate, '00:00'),
        })),
      );
      await tx.insert(medicationDoses).values([
        {
          id: id('taken'),
          patientId,
          medicineId: id('statin'),
          name: 'Atorvastatin 20mg',
          dose: '1 tablet with water',
          status: 'Taken',
          scheduledFor: when(today, '08:00'),
          scheduledTime: '08:00',
          takenAt: now,
          recordedAt: now,
        },
        {
          id: id('one-off'),
          patientId,
          name: 'Tylenol Extra Strength (demo)',
          dose: '2 tablets',
          status: 'Taken',
          takenAt: now,
          recordedAt: now,
        },
      ]);
      // A small valid PDF, stored through the same optional attachment fields as uploads.
      const stream =
        'BT /F1 18 Tf 50 750 Td (DEMO prescription - not for dispensing) Tj 0 -30 Td /F1 12 Tf (Dr Example - Atorvastatin 20mg - 1 tablet daily) Tj ET';
      const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ];
      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      objects.forEach((obj, i) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
      });
      const xref = Buffer.byteLength(pdf);
      pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((n) => `${String(n).padStart(10, '0')} 00000 n \n`)
        .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      await tx.insert(prescriptions).values([
        {
          id: id('rx-current'),
          patientId,
          prescriber: 'Dr Example (demo)',
          issuedOn: today,
          reference: 'DEMO-001',
          items: [
            {
              name: 'Atorvastatin 20mg',
              dose: '1 tablet daily with water',
              quantity: '30 tablets',
              refills: 2,
            },
          ],
          attachmentName: 'demo-prescription.pdf',
          attachmentType: 'application/pdf',
          attachmentData: Buffer.from(pdf).toString('base64'),
        },
        {
          id: id('rx-past'),
          patientId,
          prescriber: 'Dr Example (demo)',
          issuedOn: past,
          validUntil: past,
          active: false,
          items: [
            {
              name: 'Completed treatment (demo)',
              dose: '1 tablet',
              quantity: '7 tablets',
              refills: 0,
            },
          ],
        },
      ]);
    });
    console.log(
      'Medication demo created. Morning viewing best matches the approved reference. Records use the seed process timezone.',
    );
  } finally {
    await pool.end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
