import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { toast } from '../Toast';

const quickPrompts = [
  'Tailor my resume to this job',
  'Improve bullet points with action verbs',
  'Add metrics and quantifiable results',
  'Optimize the summary section',
  'Make the tone more professional',
  'Fix any LaTeX syntax errors',
];

export function AIChat() {
  const { latexCode, setLatexCode, messages, addMessage, updateMessage, jobContext, analysis } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    addMessage({ id: `msg-${Date.now()}`, role: 'user', content: userMessage, timestamp: Date.now() });
    setLoading(true);

    try {
      const jobDescription = jobContext.description || (analysis ? JSON.stringify(analysis) : '');
      const result = await api.aiEdit(latexCode, userMessage, jobDescription);

      const msgId = `msg-${Date.now()}`;
      addMessage({
        id: msgId,
        role: 'assistant',
        content: "I've prepared changes to your resume. Review them below, then apply to your editor.",
        timestamp: Date.now(),
        updatedLatex: result.updated_latex,
        applied: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${msg}`,
        timestamp: Date.now(),
      });
      toast(`AI edit failed: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (msgId: string, updatedLatex: string) => {
    setApplyingId(msgId);
    setLatexCode(updatedLatex);
    updateMessage(msgId, { applied: true });
    toast('Changes applied to editor', 'success');
    setTimeout(() => setApplyingId(null), 300);
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 ghost-border flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        <h2 className="font-headline text-lg font-bold">AI Assistant</h2>
        {loading && (
          <span className="flex items-center gap-1 text-[10px] text-primary font-medium uppercase tracking-wider ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'pulse-subtle 1.5s infinite' }} />
            Thinking
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area"
        role="log"
        aria-live="polite"
        aria-label="AI chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="material-symbols-outlined text-4xl text-primary/30 mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <p className="text-sm font-medium text-on-surface mb-1">How can I help?</p>
            <p className="text-xs text-on-surface-variant/70 mb-4 max-w-[200px]">Describe what changes you'd like to make to your resume</p>
            <div className="flex flex-col gap-1.5 w-full">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-xs px-3 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all duration-200 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              {/* Message bubble */}
              <div
                className={`max-w-[90%] px-3 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-container text-on-primary rounded-lg'
                    : 'bg-surface-container text-on-surface rounded-lg'
                }`}
              >
                {msg.content}
              </div>

              {/* Action buttons — only for assistant messages with updatedLatex */}
              {msg.role === 'assistant' && msg.updatedLatex && (
                <div className="flex items-center gap-2 mt-1.5">
                  {msg.applied ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Applied
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApply(msg.id, msg.updatedLatex!)}
                        disabled={applyingId !== null}
                        className="flex items-center gap-1 px-2.5 py-1 bg-primary text-on-primary text-[11px] font-bold rounded-sm hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        {applyingId === msg.id ? 'Applying...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => {
                          setLatexCode(msg.updatedLatex!);
                          toast('Preview loaded — click Apply to keep', 'info');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-medium rounded-sm hover:bg-surface-container-highest transition-all duration-200 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([msg.updatedLatex!], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'resume-suggestion.tex';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-medium rounded-sm hover:bg-surface-container-highest transition-all duration-200 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                        Save .tex
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Diff preview — show a snippet of what changed */}
              {msg.role === 'assistant' && msg.updatedLatex && !msg.applied && (
                <details className="mt-1.5 w-full max-w-[90%]">
                  <summary className="text-[10px] text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors duration-200 select-none">
                    Show changes
                  </summary>
                  <div className="mt-1 p-2 bg-surface-container-highest rounded-sm max-h-32 overflow-y-auto border border-outline-variant/20">
                    <pre className="text-[10px] font-mono text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                      {msg.updatedLatex.length > 2000
                        ? msg.updatedLatex.substring(0, 2000) + '\n\n... (truncated)'
                        : msg.updatedLatex}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-surface-container text-on-surface px-4 py-3 rounded-lg flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" style={{ animation: 'pulse-subtle 1s infinite' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" style={{ animation: 'pulse-subtle 1s 0.2s infinite' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" style={{ animation: 'pulse-subtle 1s 0.4s infinite' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-container-low">
        <div className="flex items-center gap-2 bg-surface-container-lowest border-b-2 border-outline focus-within:border-primary px-3 py-1 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask AI to edit..."
            className="flex-1 bg-transparent text-sm outline-none py-2 text-on-surface placeholder:text-on-surface-variant/50"
            disabled={loading}
            aria-label="AI chat message input"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="text-primary disabled:opacity-30 hover:opacity-70 transition-all duration-200 flex-shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </>
  );
}
