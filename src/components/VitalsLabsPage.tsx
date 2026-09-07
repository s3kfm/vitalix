'use client';
import { useState } from 'react';
import { downloadReport } from '../lib/downloadReport';
import { Plus, FileUp, Search, FileText, Download } from 'lucide-react';
import { PageHeading } from './ui/PageHeading';
import { Tabs } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { formatDate } from './ui/format';
import { MeasurementTable } from './records/MeasurementTable';
import { MeasurementModal } from './records/MeasurementModal';
import { UploadReportModal } from './records/UploadReportModal';
import { useHealthRecords } from '../context/HealthRecordsContext';
const viewOptions = ['Measurements', 'Lab results', 'Reports'] as const;
type View = (typeof viewOptions)[number];
export function VitalsLabsPage() {
  const { labs, reports } = useHealthRecords();
  const [tab, setTab] = useState<View>('Measurements');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'measurement' | 'report' | null>(null);
  const results = labs.filter(l => l.name.toLowerCase().includes(query.toLowerCase()));
  const files = reports.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-stack"><PageHeading title="Measurements & labs" description="A home for every reading. Not just the usual ones." action={<div className="row-actions"><button className="button secondary" onClick={() => setModal('report')}><FileUp size={17}/>Add report</button><button className="button" onClick={() => setModal('measurement')}><Plus size={17}/>Add measurement</button></div>}/><section className="panel"><div className="panel-toolbar"><Tabs options={viewOptions} value={tab} onChange={setTab}/><label className="search-field"><Search size={16}/><input aria-label="Search health records" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search records"/></label></div>{tab === 'Measurements' && <MeasurementTable query={query}/ >}{tab === 'Lab results' && <><div className="table-scroll"><table><thead><tr><th>Test</th><th>Result</th><th>Reference range</th><th>Sample date</th><th>Source</th></tr></thead><tbody>{results.map(l => <tr key={l.id}><td><strong>{l.name}</strong></td><td>{l.value} <span className="muted">{l.unit}</span></td><td>{l.range} {l.unit}</td><td>{formatDate(l.recordedAt)}</td><td><span className="badge neutral">Sample data</span></td></tr>)}</tbody></table></div>{!results.length && <EmptyState title="No matching results" description="Try searching for a different test."/>}<p className="panel-footnote">Example results and report ranges. Uploaded reports are kept separately until extraction is available.</p></>}{tab === 'Reports' && (files.length ? <div>{files.map(r => <div className="medicine-row" key={r.id}><span className="icon-tile"><FileText size={20}/></span><div className="row-main"><strong>{r.name}</strong><p>{formatDate(r.recordedAt)} · Not extracted</p></div>{r.file && <button className="button secondary small" onClick={() => downloadReport(r)}><Download size={15}/>Download</button>}</div>)}</div> : <EmptyState title="Your reports, all together" description="Add a PDF or image to keep the original alongside your records."/>)}</section>{modal === 'measurement' && <MeasurementModal onClose={() => setModal(null)}/ >}{modal === 'report' && <UploadReportModal onClose={() => setModal(null)}/>}</div>;
}
