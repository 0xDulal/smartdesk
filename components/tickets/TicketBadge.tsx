import React from 'react';
import type { TicketPriority, TicketStatus } from '@/lib/types/ticket';
import { getSlaRemainingText } from '@/lib/workflow/sla';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, { bg: string; dot: string; label: string }> = {
    open: {
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      dot: 'bg-emerald-400',
      label: 'Open',
    },
    in_progress: {
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dot: 'bg-amber-400',
      label: 'In Progress',
    },
    resolved: {
      bg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
      dot: 'bg-sky-400',
      label: 'Resolved',
    },
    closed: {
      bg: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400',
      dot: 'bg-zinc-400',
      label: 'Closed',
    },
  };

  const config = styles[status] || styles.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const styles: Record<TicketPriority, { bg: string; label: string }> = {
    low: { bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20', label: 'Low' },
    medium: { bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20', label: 'Medium' },
    high: { bg: 'bg-orange-500/10 text-orange-300 border-orange-500/20', label: 'High' },
    urgent: { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', label: 'Urgent' },
  };

  const config = styles[priority] || styles.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
}

export function SlaBadge({
  slaDueAt,
  status,
}: {
  slaDueAt: string;
  status: TicketStatus;
}) {
  const { text, isOverdue } = getSlaRemainingText(slaDueAt, status);

  if (status === 'resolved' || status === 'closed') {
    return (
      <span className="text-[11px] text-zinc-400">
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${
        isOverdue
          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
          : 'bg-white/5 text-zinc-300 border-white/10'
      }`}
    >
      SLA: {text}
    </span>
  );
}
