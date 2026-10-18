'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Inbox,
  LogOut,
  Filter,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, SlaBadge } from './TicketBadge';
import { TicketConversationModal } from './TicketConversationModal';
import { updateTicketStatusAction } from '@/lib/actions/tickets';
import { isSlaBreached } from '@/lib/workflow/sla';
import { signOut } from '@/lib/actions/auth';
import type { Ticket, TicketPriority, TicketStatus } from '@/lib/types/ticket';
import { useRouter } from 'next/navigation';

interface StaffDashboardViewProps {
  userEmail: string;
  initialTickets: Ticket[];
}

export function StaffDashboardView({
  userEmail,
  initialTickets,
}: StaffDashboardViewProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Compute stats
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    overdue: tickets.filter((t) => isSlaBreached(t.sla_due_at, t.status)).length,
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  async function handleQuickStatus(e: React.MouseEvent, ticketId: string, newStatus: TicketStatus) {
    e.stopPropagation();
    setActionLoadingId(ticketId);

    const res = await updateTicketStatusAction(ticketId, newStatus);
    if (res.success && res.data) {
      setTickets((prev) =>
        prev.map((item) => (item.id === ticketId ? (res.data as Ticket) : item))
      );
      router.refresh();
    }
    setActionLoadingId(null);
  }

  return (
    <div className="min-h-screen bg-[#241f30] text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#2a243a]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c5cfc] to-[#b4a5fc] flex items-center justify-center shadow-md shadow-[#7c5cfc]/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">SmartDesk Helpdesk</span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#7c5cfc]/20 text-[#c4b5fd] border border-[#7c5cfc]/30">
                Staff Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50 hidden sm:inline">{userEmail}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-rose-300/80 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-md transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Ticket Queue</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Inbox className="w-6 h-6 text-[#9e8cfc]" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Awaiting Action</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.open}</p>
            </div>
            <Clock className="w-6 h-6 text-emerald-400/80" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.inProgress}</p>
            </div>
            <Clock className="w-6 h-6 text-amber-400/80" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-sky-400 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-sky-400/80" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-red-500/20 col-span-2 lg:col-span-1 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-300 font-medium">SLA Breached</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#2a243a] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer shrink-0 ${
                  statusFilter === status
                    ? 'bg-[#7c5cfc] text-white shadow-xs'
                    : 'bg-[#352f47] text-white/60 hover:text-white hover:bg-[#3f3854]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#352f47] border border-white/10 text-xs text-white focus:outline-none focus:border-[#7c5cfc]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, user, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-[#352f47] border border-white/5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#7c5cfc] transition"
              />
            </div>
          </div>
        </div>

        {/* Tickets Table / Cards */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#2a243a]/40 border border-white/5 space-y-2">
              <Inbox className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-sm font-medium text-white/70">No tickets matching filter</p>
              <p className="text-xs text-white/40">Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isOverdue = isSlaBreached(ticket.sla_due_at, ticket.status);
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 sm:p-5 rounded-xl bg-[#2b253c] hover:bg-[#332c47] border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    isOverdue ? 'border-red-500/40 bg-red-950/10' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      <SlaBadge slaDueAt={ticket.sla_due_at} status={ticket.status} />
                      <span className="text-[11px] text-white/40 font-mono">
                        #{ticket.id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60 capitalize">
                        {ticket.category}
                      </span>
                      {ticket.ai_summary && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#7c5cfc]/20 text-[#c4b5fd]">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI Triaged
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-white group-hover:text-[#c4b5fd] transition truncate">
                      {ticket.title}
                    </h3>

                    <p className="text-xs text-white/60 line-clamp-1">
                      {ticket.ai_summary || ticket.description}
                    </p>

                    <div className="text-[11px] text-white/40 flex items-center gap-3">
                      <span>Submitted by: <strong className="text-white/70">{ticket.user_email}</strong></span>
                      <span>&bull;</span>
                      <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons for Staff */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    {ticket.status === 'open' && (
                      <button
                        onClick={(e) => handleQuickStatus(e, ticket.id, 'in_progress')}
                        disabled={actionLoadingId === ticket.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition cursor-pointer"
                      >
                        Accept & Progress
                      </button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={(e) => handleQuickStatus(e, ticket.id, 'resolved')}
                        disabled={actionLoadingId === ticket.id}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium border border-sky-500/30 transition cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#7c5cfc]/20 hover:bg-[#7c5cfc]/30 text-[#c4b5fd] text-xs font-medium border border-[#7c5cfc]/30 transition cursor-pointer"
                    >
                      Open Thread &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Ticket Details & Conversation Modal */}
      {selectedTicketId && (
        <TicketConversationModal
          ticketId={selectedTicketId}
          isStaff={true}
          currentUserEmail={userEmail}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
