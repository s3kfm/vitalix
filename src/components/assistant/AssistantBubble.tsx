'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { MessageCircle, Sparkles, Paperclip, ArrowUp, X, RotateCcw, Square, FileText, LoaderCircle } from 'lucide-react';
import type { HealthChatMessage } from '@/src/lib/assistant/agent';
import { attachmentAccept, prepareFiles, validateFiles } from '@/src/lib/assistant/attachments';
import { ChangesetCard } from './ChangesetCard';

const transport = new DefaultChatTransport<HealthChatMessage>({
  api: '/api/chat',
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      messages: messages.map(message => ({ ...message, parts: message.parts.filter(part => !(part.type.startsWith('tool-') && 'state' in part && part.state === 'input-streaming')) })),
    },
  }),
});
const suggestions = ['I had a headache this afternoon', 'Log my blood pressure', 'Add a medication'];

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort(); };
  }, [file]);
  return url ? <Image src={url} alt={file.name} width={40} height={40} unoptimized /> : <FileText size={20} />;
}

export function AssistantBubble() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revising, setRevising] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const followScroll = useRef(true);
  const sending = useRef(false);
  const { messages, sendMessage, addToolOutput, status, error, clearError, regenerate, stop, setMessages } = useChat<HealthChatMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  const busy = status === 'submitted' || status === 'streaming';
  const pending = messages.some(message => message.parts.some(part => part.type === 'tool-confirmRecords' && part.state === 'input-available'));
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    if (open && followScroll.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, status, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending.current || busy || pending || saving || (!draft.trim() && !files.length)) return;
    sending.current = true;
    setPreparing(true);
    setLocalError(null);
    clearError();
    try {
      const attachments = await prepareFiles(files);
      const text = draft.trim();
      // Keep the submitted message in the transcript for SDK retries; clear the composer once queued.
      const sent = sendMessage({ text, files: attachments });
      setDraft('');
      setFiles([]);
      setRevising(false);
      followScroll.current = true;
      await sent;
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Could not send your message. Please try again.');
    } finally {
      sending.current = false;
      setPreparing(false);
    }
  };
  const reset = () => {
    if (busy || saving || preparing) return;
    setMessages([]);
    setFiles([]);
    setDraft('');
    setLocalError(null);
    setRevising(false);
    clearError();
    input.current?.focus();
  };
  return <>
    <button ref={trigger} className="assistant-bubble" onClick={() => open ? close() : setOpen(true)} aria-label={open ? 'Close health assistant' : 'Open health assistant'} aria-expanded={open} aria-controls="health-assistant">
      {open ? <X size={21} /> : <MessageCircle size={21} />}<span>Assistant</span>
      {!open && pending && <span className="assistant-notification" aria-label="Records ready to review" />}
    </button>
    <section id="health-assistant" className="assistant-panel" role="dialog" aria-labelledby="assistant-title" hidden={!open}>
      <header className="assistant-header">
        <span className="assistant-avatar"><Sparkles size={22} /></span>
        <div><h2 id="assistant-title">Your health assistant</h2><p>A simpler way to record</p></div>
        <button className="assistant-icon-button" title="Start a new chat" aria-label="Start a new chat" disabled={busy || saving || preparing || !messages.length} onClick={reset}><RotateCcw size={17} /></button>
        <button className="assistant-icon-button" aria-label="Close chat" onClick={close}><X size={20} /></button>
      </header>
      <div ref={scroller} className="assistant-conversation" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" onScroll={() => {
        const node = scroller.current;
        if (node) followScroll.current = node.scrollHeight - node.scrollTop - node.clientHeight < 90;
      }}>
        {!messages.length && <div className="assistant-welcome">
          <span className="assistant-welcome-icon"><Sparkles size={28} /></span>
          <h3>What would you like to record?</h3>
          <p>Tell me about your day, or attach a health report. We’ll review everything together before saving.</p>
          <div className="assistant-suggestions">{suggestions.map(text => <button key={text} onClick={() => { setDraft(text); input.current?.focus(); }}>{text}<ArrowUp size={14} /></button>)}</div>
          <p className="assistant-session-note">Chat is temporary and clears on refresh. Records you confirm stay saved.</p>
        </div>}
        {messages.map(message => <div className={`assistant-message assistant-message-${message.role}`} key={message.id}>
          <span className="assistant-speaker">{message.role === 'user' ? 'You' : 'Assistant'}</span>
          {message.parts.map((part, index) => {
            if (part.type === 'text') return part.text ? <div className="assistant-message-text" key={index}>{part.text}</div> : null;
            if (part.type === 'file') return <div className="assistant-message-file" key={index}>
              {part.mediaType.startsWith('image/') ? <Image src={part.url} alt={part.filename || 'Attached image'} width={240} height={180} unoptimized /> : <FileText size={22} />}
              <span>{part.filename || 'Attachment'}</span>
            </div>;
            if (part.type === 'tool-getRecordContext') return <p className="assistant-tool-status" key={index}>{part.state === 'output-available' ? 'Health record context loaded' : part.state === 'output-error' ? 'Could not load health records' : 'Checking your medications and measurement types…'}</p>;
            if (part.type === 'tool-confirmRecords') {
              if (part.state === 'input-streaming') return <p className="assistant-tool-status" key={part.toolCallId}><LoaderCircle className="assistant-spin" size={14} />Preparing records for review…</p>;
              if (part.state === 'input-available' || part.state === 'output-available') return <ChangesetCard
                key={part.toolCallId}
                changeset={part.input}
                output={part.state === 'output-available' ? part.output : undefined}
                disabled={busy || saving}
                onSavingChange={setSaving}
                onEdit={() => { setRevising(true); input.current?.focus(); }}
                onResult={output => { void addToolOutput({ tool: 'confirmRecords', toolCallId: part.toolCallId, output }); }}
              />;
              if (part.state === 'output-error') return <p role="alert" key={part.toolCallId}>The proposal could not be completed. Please ask me to try again.</p>;
            }
            return null;
          })}
        </div>)}
        {busy && <div className="assistant-thinking" role="status"><span /><span /><span />{status === 'submitted' ? 'Thinking…' : 'Replying…'}</div>}
      </div>
      <div className="assistant-composer-area">
        {(localError || error) && <div className="assistant-error" role="alert"><p>{localError || error?.message}</p>{error && !pending && <button className="assistant-text-button" disabled={busy || saving} onClick={() => { clearError(); void regenerate(); }}>Retry reply</button>}</div>}
        {pending && <p className="assistant-composer-hint">Review the records above to save, make changes, or cancel.</p>}
        {revising && !pending && <p className="assistant-composer-hint">Tell me what to change. I’ll prepare a new review.</p>}
        <form className="assistant-composer" onSubmit={submit}>
          {!!files.length && <div className="assistant-attachments">{files.map((file, index) => <div className="assistant-attachment" key={`${file.name}-${index}`}><FilePreview file={file} /><span>{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} disabled={preparing} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X size={14} /></button></div>)}</div>}
          <label className="sr-only" htmlFor="assistant-draft">Message</label>
          <textarea ref={input} id="assistant-draft" rows={2} maxLength={10000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Describe a symptom, medication, or measurement…" onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
          <div className="assistant-composer-actions">
            <label className={`assistant-attach-button${busy || preparing || pending || saving ? ' is-disabled' : ''}`} title="Images, PDF, or TXT · up to 3 files, 3 MB each"><Paperclip size={18} /><span>Attach</span><input className="sr-only" type="file" accept={attachmentAccept} multiple disabled={busy || preparing || pending || saving} onChange={event => {
              const selected = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = '';
              try { const next = [...files, ...selected]; validateFiles(next); setFiles(next); setLocalError(null); }
              catch (cause) { setLocalError(cause instanceof Error ? cause.message : 'Could not attach these files.'); }
            }} /></label>
            {busy ? <button type="button" className="assistant-send" aria-label="Stop response" onClick={() => void stop()}><Square size={15} /></button> : <button type="submit" className="assistant-send" aria-label="Send message" disabled={preparing || saving || pending || (!draft.trim() && !files.length)}>{preparing ? <LoaderCircle className="assistant-spin" size={18} /> : <ArrowUp size={19} />}</button>}
          </div>
        </form>
        <p className="assistant-footer-note">AI assistant · You review every record before saving</p>
      </div>
    </section>
  </>;
}
