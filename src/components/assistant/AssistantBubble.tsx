'use client';

import { useState, type FormEventHandler, type ChangeEventHandler } from 'react';
import { MessageCircle, Sparkles, Paperclip, ArrowUp, X } from 'lucide-react';
import { Modal } from '../Modals';
import { FormError } from '../ui/FormError';
import { validateReportFile } from '../../lib/recordValidation';

interface PreviewMessage {
  id: string;
  text: string;
  attachmentName: string | null;
}

const suggestions: readonly string[] = [
  'I had a headache this afternoon',
  'I took my medication at 8 AM',
];

export function AssistantBubble() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const attach: ChangeEventHandler<HTMLInputElement> = (event) => {
    const selected = event.currentTarget.files?.[0];
    if (!selected) return;
    setError(null);
    try {
      validateReportFile(selected);
      setFile(selected);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Please choose another file.');
    }
    event.currentTarget.value = '';
  };

  const preview: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text && !file) return;
    setMessages(previous => [...previous, {
      id: crypto.randomUUID(),
      text,
      attachmentName: file?.name ?? null,
    }]);
    setDraft('');
    setFile(null);
    setError(null);
  };

  return (
    <>
      <button className="assistant-bubble" onClick={() => setOpen(true)} aria-label="Open health assistant">
        <MessageCircle size={21} /><span>Assistant</span>
      </button>
      {open && (
        <Modal title="Your health assistant" onClose={() => setOpen(false)}>
          <div className="assistant-intro">
            <span className="icon-tile"><Sparkles size={24} /></span>
            <h3>A simpler way to record.</h3>
            <p>Describe your day or attach a health report.</p>
          </div>
          <p className="preview-note">Preview · AI recording and report extraction are not connected yet.</p>
          <div className="chat-messages" aria-live="polite">
            {messages.map(message => (
              <div className="chat-message" key={message.id}>
                {message.text}
                {message.attachmentName && <p className="attachment">{message.attachmentName}</p>}
              </div>
            ))}
            {messages.length > 0 && (
              <p className="muted text-sm">Nothing has been added to your health record. Use the manual entry forms for now.</p>
            )}
          </div>
          {messages.length === 0 && (
            <div className="suggestions">
              {suggestions.map(text => <button key={text} onClick={() => setDraft(text)}>{text}</button>)}
            </div>
          )}
          <form onSubmit={preview}>
            <FormError message={error} />
            <label className="sr-only" htmlFor="assistant-draft">Message</label>
            <textarea id="assistant-draft" rows={3} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Tell me what you’d like to record…" />
            {file && (
              <div className="attachment">
                {file.name}
                <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}><X size={16} /></button>
              </div>
            )}
            <div className="form-actions">
              <label className="button secondary">
                <Paperclip size={16} />Attach
                <input className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={attach} />
              </label>
              <button className="button" disabled={!draft.trim() && !file}>Preview message<ArrowUp size={16} /></button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
