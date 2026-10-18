'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { createTicketAction } from '@/lib/actions/tickets';
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
  const [autoTriage, setAutoTriage] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('description', description);
      // If autoTriage is active, we let the backend AI triage categorize and prioritize
      formData.set('category', autoTriage ? 'general' : category);
      formData.set('priority', autoTriage ? 'medium' : priority);

      const res = await createTicketAction(formData);

      if (!res.success) {
        setError(res.error || 'Failed to submit ticket');
        setIsLoading(false);
        return;
      }

      setTitle('');
      setDescription('');
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
              minLength={5}
              maxLength={120}
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
              maxLength={2000}
              placeholder="Provide relevant details, steps to reproduce, or any error messages..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-[#353046] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition resize-none"
            />
          </div>

          {/* AI Auto-triage toggle */}
          <div className="p-3 rounded-lg bg-[#2e293f] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#9e8cfc]" />
              <div>
                <p className="text-xs font-medium text-white">SmartDesk AI Auto-Classification</p>
                <p className="text-[11px] text-white/50">
                  Automatically predicts category and SLA urgency based on your description
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoTriage}
                onChange={(e) => setAutoTriage(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#3e3852] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6c5dd3]"></div>
            </label>
          </div>

          {!autoTriage && (
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
          )}

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
