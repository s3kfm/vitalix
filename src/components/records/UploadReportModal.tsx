'use client';
import { parseReportForm } from '../../lib/recordValidation';
import { useRecordForm } from '../../hooks/useRecordForm';
import { FormError } from '../ui/FormError';
import { useState } from 'react';
import { localDateTime } from '../ui/format';
import { FileUp } from 'lucide-react';
import { Modal } from '../Modals';
import { useHealthRecords } from '../../context/HealthRecordsContext';
export function UploadReportModal({ onClose }: { onClose: () => void }) {
  const { addReport } = useHealthRecords();
  const [file, setFile] = useState<File | null>(null);
  const { error, onSubmit } = useRecordForm({ parse: data => parseReportForm(data, file), save: addReport, onSuccess: onClose });
  return <Modal title="Add a health report" onClose={onClose}><form className="entry-form" onSubmit={onSubmit}><FormError message={error}/><label className="upload-zone"><FileUp size={30}/><strong>{file?.name || 'Choose a report'}</strong><span>PDF or image · Up to 20 MB</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" required onChange={e => setFile(e.target.files?.[0] ?? null)}/></label><label>Report date<input type="date" name="date" required defaultValue={localDateTime().slice(0, 10)}/></label><p className="preview-note">Files stay in this preview until you refresh. Report extraction is not connected yet.</p><div className="form-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button" disabled={!file}>Add report</button></div></form></Modal>;
}
