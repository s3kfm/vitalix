'use client';

import { useState, type FormEventHandler } from 'react';

interface RecordFormOptions<T> {
  parse: (data: FormData) => T;
  save: (record: T) => void;
  onSuccess: () => void;
}

/** Never close the dialog or mutate records when parsing fails. */
export function useRecordForm<T>({ parse, save, onSuccess }: RecordFormOptions<T>) {
  const [error, setError] = useState<string | null>(null);
  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setError(null);
    try {
      const record = parse(new FormData(event.currentTarget));
      save(record);
      onSuccess();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Please check your entry and try again.');
    }
  };
  return { error, onSubmit };
}
