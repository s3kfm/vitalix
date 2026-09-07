import React, { useState } from 'react';
import { Paperclip, ArrowUp, Sparkles } from 'lucide-react';

interface AssistantInputBarProps {
  variant?: 'hero' | 'compact';
  onNavigateToIntake: (prefilledText?: string, autoStage?: boolean) => void;
}

export const AssistantInputBar: React.FC<AssistantInputBarProps> = ({
  variant = 'hero',
  onNavigateToIntake
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    onNavigateToIntake(text, text.toLowerCase().includes('period') || text.toLowerCase().includes('lab'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttachClick = () => {
    onNavigateToIntake(text, true);
  };

  if (variant === 'compact') {
    return (
      <div className="w-full bg-white border border-[#e8e4db] rounded-2xl p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 pl-1 text-[#5a6344]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-mono-data text-[11px] uppercase tracking-wider font-semibold">
              Vitalix Intelligence
            </span>
          </div>
          <span className="text-[#dfd3c3] hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 flex-1 bg-[#f4f1eb] px-3 py-1.5 rounded-xl border border-[#e8e4db] focus-within:border-[#5a6344] focus-within:bg-white transition-all">
            <button
              type="button"
              onClick={handleAttachClick}
              className="text-[#7a7267] hover:text-[#3a3530] transition-colors p-0.5"
              title="Attach document or lab"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Upload a document, lab result or type to record your symptoms..."
              className="flex-1 bg-transparent text-xs text-[#3a3530] placeholder:text-[#7a7267] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          className="self-end sm:self-auto flex items-center justify-center h-8 px-3.5 rounded-xl bg-[#5a6344] hover:bg-[#4a5237] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 gap-1.5 cursor-pointer"
        >
          <span>Send</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="w-full bg-white rounded-3xl border border-[#e8e4db] shadow-xs hover:border-[#dfd3c3] transition-all p-4 sm:p-5 focus-within:border-[#5a6344] focus-within:ring-3 focus-within:ring-[#5a6344]/15 flex flex-col justify-between min-h-[140px] relative group">
        <div className="w-full">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Upload a document, lab result or type to record your symptoms..."
            className="w-full bg-transparent border-0 text-sm sm:text-base text-[#3a3530] placeholder:text-[#7a7267] focus:outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-[#e8e4db]/80 select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAttachClick}
              title="Attach files or drop here"
              className="p-2 rounded-xl border border-[#e8e4db] hover:border-[#dfd3c3] hover:bg-[#f4f1eb] text-[#7a7267] hover:text-[#3a3530] flex items-center justify-center transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToIntake(text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e8e4db] hover:bg-[#f4f1eb] text-[#544d44] text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5a6344]" />
              <span className="font-semibold text-[#3a3530]">Vitalix Intelligence</span>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSend}
              title="Send prompt"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                text.trim().length > 0
                  ? 'bg-[#5a6344] text-white hover:bg-[#4a5237] shadow-sm hover:scale-105 active:scale-95'
                  : 'bg-[#f4f1eb] hover:bg-[#5a6344] hover:text-white text-[#7a7267]'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
