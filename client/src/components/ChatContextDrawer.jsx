import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, ArrowDown, Layers, Award } from 'lucide-react';

const SENDER_STYLES = {
  Rohan: { color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20' },
  Priya: { color: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/20' },
  Kabir: { color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20' },
  Ananya: { color: 'text-pink-400', badge: 'bg-pink-500/10 border-pink-500/20' },
  Vikram: { color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20' },
  Sneha: { color: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/20' },
  Amit: { color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/20' },
  Neha: { color: 'text-teal-400', badge: 'bg-teal-500/10 border-teal-500/20' }
};

function formatTimeOnly(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function formatDateHeader(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

export default function ChatContextDrawer({ isOpen, onClose, contextData, isLoading }) {
  const targetRef = useRef(null);

  // Auto-scroll to target message when context is loaded
  useEffect(() => {
    if (isOpen && targetRef.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [isOpen, contextData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Drawer Container */}
      <div className="w-full max-w-xl h-full bg-[#0b0f17] border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Conversation Context</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                  &plusmn;5 Messages
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {contextData ? `Thread: ${contextData.threadId}` : 'Loading dialogue history...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader info */}
        <div className="px-5 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chronological stream</span>
          </span>
          <button
            onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium transition"
          >
            <span>Jump to match</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-[#0b0f17]">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-mono">Reconstructing surrounding context...</p>
            </div>
          ) : (contextData?.contextWindow?.length > 0 || contextData?.messages?.length > 0) ? (
            (contextData.contextWindow || contextData.messages).map((m, index) => {
              const messagesList = contextData.contextWindow || contextData.messages;
              const isTarget = m.isTarget || m.id === contextData.targetId || m.id === contextData.targetMessageId;
              const senderStyle = SENDER_STYLES[m.sender] || { color: 'text-slate-300', badge: 'bg-slate-800' };
              const prevMsg = messagesList[index - 1];
              const isNewDay = !prevMsg || formatDateHeader(prevMsg.timestamp) !== formatDateHeader(m.timestamp);

              return (
                <React.Fragment key={m.id}>
                  {/* Date Separator */}
                  {isNewDay && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-0.5 rounded-full bg-slate-800/80 text-[11px] font-mono text-slate-400 border border-slate-700/60">
                        {formatDateHeader(m.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Chat Message Bubble */}
                  <div
                    ref={isTarget ? targetRef : null}
                    className={`rounded-xl p-3 text-xs transition-all ${
                      isTarget
                        ? 'bg-slate-900 border-2 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${senderStyle.color}`}>
                          {m.sender}
                        </span>
                        {isTarget && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                            <Award className="w-2.5 h-2.5" /> Match Hit
                          </span>
                        )}
                        {m.isDecision && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 text-[10px] font-mono">
                            Decision
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTimeOnly(m.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs font-mono">
              No conversation context found for this message.
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Surrounding window: &plusmn;5 messages</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
