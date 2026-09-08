'use client';
import { HeartPulse } from 'lucide-react';
import { Button } from 'rsuite';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SymptomRecord } from '../../db/symptoms';
import { formatDate } from '../ui/format';
import { FormError } from '../ui/FormError';

export function SymptomRow({ symptom }: { symptom: SymptomRecord }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => axios.patch(`/api/symptoms/${symptom.id}`),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['symptoms'] }); },
  });
  return <article className="symptom-row">
    <span className="icon-tile peach"><HeartPulse size={20}/></span>
    <div className="row-main">
      <div className="inline-title"><h3>{symptom.code.text}</h3>{symptom.severity !== null && <span className="badge neutral">{symptom.severity}/10</span>}</div>
      <p>Started {formatDate(symptom.onsetAt)}{symptom.bodySite?.text && ` · ${symptom.bodySite.text}`}</p>
      {symptom.resolvedAt && <p>Ended {formatDate(symptom.resolvedAt)}</p>}
      {symptom.notes && <p className="symptom-notes">{symptom.notes}</p>}
      <FormError message={mutation.isError ? 'Could not resolve symptom. Please try again.' : null}/>
    </div>
    {symptom.resolvedAt ? <span className="badge neutral">Ended</span> : <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>Mark resolved</Button>}
  </article>;
}
