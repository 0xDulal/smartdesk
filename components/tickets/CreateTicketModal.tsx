'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Check } from 'lucide-react';
import { createTicketAction, suggestTicketClassificationAction } from '@/lib/actions/tickets';
import type { TicketCategory, TicketPriority } from '@/lib/types/ticket';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated?: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onTicketCreated }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSuggestWithAi() {
    if (title.trim().length < 3 || description.trim().length < 10) {
      setError('Please provide at least a short title and 10+ character description for AI suggestions.');
      return;
    }

    setError(null);
    setIsSuggesting(true);
    setSuggestionApplied(false);
    setAiNote(null);

    try {
      const res = await suggestTicketClassificationAction(title.trim(), description.trim());
      if (res.success && res.data) {
        setCategory(res.data.category);
        setPriority(res.data.priority);
        setAiNote(`AI suggested "${res.data.category}" category with "${res.data.priority}" priority (${Math.round((res.data.confidence || 0.85) * 100)}% confidence).`);
        setSuggestionApplied(true);
      } else {
        setError(res.error || 'AI suggestion failed. You can choose category and priority manually.');
      }
    } catch {
      setError('AI suggestion service error. Please select manually.');
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('description', description);
      formData.set('category', category);
      formData.set('priority', priority);

      const res = await createTicketAction(formData);

      if (!res.success) {
        setError(res.error || 'Failed to submit ticket');
        setIsLoading(false);
        return;
      }

      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      setAiNote(null);
      setSuggestionApplied(false);
      setIsLoading(false);
      onClose();
      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl bg-[#231f30] border border-white/10 shadow-2xl p-6 text-white space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Create Support Ticket</h2>
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#7c5cfc]/20 text-[#a997fd] border border-[#7c5cfc]/30">
              <Sparkles className="w-3 h-3" />
              AI Triaged
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Subject / Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              placeholder="e.g. Cannot access payment history"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-[#353046] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              maxLength={10000}
              placeholder="Provide relevant details, steps to reproduce, or any error messages..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-[#353046] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition resize-none"
            />
          </div>

          {/* AI Suggestion Bar (FR-09 & US-08) */}
          <div className="p-3.5 rounded-lg bg-[#2e293f] border border-white/10 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9e8cfc]" />
                <span className="text-xs font-medium text-white">AI Assistant</span>
                {suggestionApplied && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    Applied
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSuggestWithAi}
                disabled={isSuggesting || !title.trim() || !description.trim()}
                className="px-3 py-1.5 rounded-md bg-[#6c5dd3]/80 hover:bg-[#6c5dd3] text-white text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Suggest with AI</span>
                  </>
                )}
              </button>
            </div>
            {aiNote ? (
              <p className="text-[11px] text-[#c4b5fd] bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 p-2 rounded">
                {aiNote}
              </p>
            ) : (
              <p className="text-[11px] text-white/50">
                Click &quot;Suggest with AI&quot; to predict category and priority before saving. You can edit suggestions below.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3 py-2 rounded-md bg-[#353046] border border-white/10 text-white text-xs focus:outline-none focus:border-[#7c5cfc]"
              >
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing & Payments</option>
                <option value="account">Account & Auth</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Support</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 rounded-md bg-[#353046] border border-white/10 text-white text-xs focus:outline-none focus:border-[#7c5cfc]"
              >
                <option value="low">Low (48h SLA)</option>
                <option value="medium">Medium (24h SLA)</option>
                <option value="high">High (12h SLA)</option>
                <option value="urgent">Urgent (4h SLA)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-md text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md text-xs font-medium text-white bg-[#6c5dd3] hover:bg-[#5e4fc7] transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting & Triaging...</span>
                </>
              ) : (
                'Submit Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
