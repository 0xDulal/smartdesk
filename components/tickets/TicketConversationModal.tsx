'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, SlaBadge } from './TicketBadge';
import {
  getTicketDetailsAction,
  addTicketMessageAction,
  updateTicketStatusAction,
} from '@/lib/actions/tickets';
import type { Ticket, TicketMessage, TicketStatus } from '@/lib/types/ticket';

interface TicketConversationModalProps {
  ticketId: string;
  isStaff: boolean;
  currentUserEmail: string;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export function TicketConversationModal({
  ticketId,
  isStaff,
  currentUserEmail,
  onClose,
  onTicketUpdated,
}: TicketConversationModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      const res = await getTicketDetailsAction(ticketId);
      if (res.success && res.data) {
        setTicket(res.data.ticket);
        setMessages(res.data.messages);
      } else {
        setError(res.error || 'Failed to load ticket details');
      }
      setLoading(false);
    }
    loadData();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    setError(null);

    const res = await addTicketMessageAction(ticketId, replyText.trim());
    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setReplyText('');
      if (ticket && isStaff && ticket.status === 'open') {
        setTicket({ ...ticket, status: 'in_progress' });
      }
      if (onTicketUpdated) onTicketUpdated();
    } else {
      setError(res.error || 'Failed to send message');
    }
    setSending(false);
  }

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticket || updatingStatus || ticket.status === newStatus) return;

    setUpdatingStatus(true);
    setError(null);

    const res = await updateTicketStatusAction(ticket.id, newStatus);
    if (res.success && res.data) {
      setTicket(res.data);
      if (onTicketUpdated) onTicketUpdated();
    } else {
      setError(res.error || 'Cannot update status');
    }
    setUpdatingStatus(false);
  }

  function insertAiDraft() {
    if (ticket?.ai_suggested_reply) {
      setReplyText(ticket.ai_suggested_reply);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl h-[85vh] max-h-[750px] rounded-xl bg-[#231f30] border border-white/10 shadow-2xl flex flex-col text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-start justify-between bg-[#2a253a]/50">
          <div className="space-y-1.5 max-w-[80%]">
            <div className="flex items-center gap-2 flex-wrap">
              {ticket && (
                <>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <SlaBadge slaDueAt={ticket.sla_due_at} status={ticket.status} />
                  <span className="text-[11px] uppercase tracking-wider text-white/40">
                    #{ticket.id.slice(0, 8)}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base font-semibold leading-tight line-clamp-1">
              {ticket?.title || 'Loading ticket...'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-3 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Insight Box (Staff only) */}
        {isStaff && ticket?.ai_summary && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-[#2e2645] border border-[#7c5cfc]/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[#c4b5fd]">
                <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                AI Triage Analysis
              </span>
              <span className="text-[11px] text-white/50">
                Confidence: {Math.round((ticket.ai_confidence || 0.9) * 100)}%
              </span>
            </div>
            <p className="text-xs text-white/80">{ticket.ai_summary}</p>
            {ticket.ai_suggested_reply && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-white/40 italic truncate max-w-[70%]">
                  Draft: &quot;{ticket.ai_suggested_reply.slice(0, 60)}...&quot;
                </span>
                <button
                  type="button"
                  onClick={insertAiDraft}
                  className="text-[11px] font-medium text-[#a78bfa] hover:text-[#c4b5fd] underline cursor-pointer"
                >
                  Insert Draft Reply
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#7c5cfc] animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Initial description block */}
            {ticket && (
              <div className="p-3.5 rounded-lg bg-[#2d283e] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-medium text-white/90">{ticket.user_email}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            )}

            {/* Conversation Thread */}
            {messages.map((msg) => {
              const isMe = msg.user_email === currentUserEmail;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs space-y-1 ${
                      msg.is_staff
                        ? 'bg-[#433878] text-white border border-[#6c5dd3]/40'
                        : 'bg-[#353046] text-white/90 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <span className="font-semibold text-white/80">
                        {msg.is_staff ? 'Support Staff' : msg.user_email}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Footer: Workflow Controls & Reply Box */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#252133] space-y-3">
          {/* Status Workflow Action Bar */}
          {ticket && (
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-white/50 text-[11px]">Workflow Actions:</span>
              <div className="flex items-center gap-1.5">
                {isStaff ? (
                  <>
                    {ticket.status !== 'in_progress' && ticket.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={updatingStatus}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium border border-amber-500/30 transition cursor-pointer"
                      >
                        Start Progress
                      </button>
                    )}
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange('resolved')}
                        disabled={updatingStatus}
                        className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-medium border border-sky-500/30 transition cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {ticket.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange('closed')}
                        disabled={updatingStatus}
                        className="px-2.5 py-1 rounded bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-300 text-[11px] font-medium border border-zinc-500/30 transition cursor-pointer"
                      >
                        Close Ticket
                      </button>
                    )}
                    {ticket.status === 'closed' && (
                      <button
                        onClick={() => handleStatusChange('open')}
                        disabled={updatingStatus}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition cursor-pointer"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => handleStatusChange('closed')}
                        disabled={updatingStatus}
                        className="px-2.5 py-1 rounded bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-300 text-[11px] font-medium border border-zinc-500/30 transition cursor-pointer"
                      >
                        Cancel / Close
                      </button>
                    )}
                    {ticket.status === 'resolved' && (
                      <>
                        <button
                          onClick={() => handleStatusChange('closed')}
                          disabled={updatingStatus}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition cursor-pointer"
                        >
                          Accept Resolution & Close
                        </button>
                        <button
                          onClick={() => handleStatusChange('open')}
                          disabled={updatingStatus}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium border border-amber-500/30 transition cursor-pointer"
                        >
                          Reopen Issue
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reply Form */}
          {ticket?.status === 'closed' ? (
            <p className="text-center text-xs text-white/40 py-2">
              This ticket is closed. Reopen the ticket to continue the conversation.
            </p>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder={isStaff ? 'Write a response to customer...' : 'Reply to support team...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-md bg-[#353046] border border-white/10 text-white placeholder-white/30 text-xs sm:text-sm focus:outline-none focus:border-[#7c5cfc] transition"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 rounded-md bg-[#6c5dd3] hover:bg-[#5e4fc7] text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
