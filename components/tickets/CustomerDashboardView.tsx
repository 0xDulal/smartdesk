'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  LogOut,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, SlaBadge } from './TicketBadge';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketConversationModal } from './TicketConversationModal';
import { signOut } from '@/lib/actions/auth';
import type { Ticket } from '@/lib/types/ticket';
import { useRouter } from 'next/navigation';

interface CustomerDashboardViewProps {
  userEmail: string;
  initialTickets: Ticket[];
}

export function CustomerDashboardView({
  userEmail,
  initialTickets,
}: CustomerDashboardViewProps) {
  const router = useRouter();
  const tickets = initialTickets;
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filter logic (FR-08: search and multiple filters work together)
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-[#241f30] text-white flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#2a243a]/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6c5dd3] to-[#9e8cfc] flex items-center justify-center shadow-md shadow-[#6c5dd3]/30">
              <LifeBuoy className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">SmartDesk</span>
              <span className="ml-2 text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                Customer Portal
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
        {/* Hero & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#322949] to-[#2b253c] p-6 rounded-2xl border border-white/10 shadow-lg">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to SmartDesk Support</h1>
            <p className="text-sm text-white/60">
              Submit issues, track real-time resolution SLAs, and communicate directly with staff.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#6c5dd3] hover:bg-[#5e4fc7] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-md shadow-[#6c5dd3]/20 active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Total Tickets</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Inbox className="w-6 h-6 text-[#9e8cfc]" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Open Issues</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.open}</p>
            </div>
            <Clock className="w-6 h-6 text-emerald-400/80" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.inProgress}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-amber-400/80" />
          </div>

          <div className="bg-[#2d273f] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-sky-400 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-sky-400/80" />
          </div>
        </div>

        {/* Filters and Search Bar (FR-08: Status, Priority, Category & Search) */}
        <div className="space-y-2.5 pt-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer shrink-0 ${
                    filterStatus === status
                      ? 'bg-[#6c5dd3] text-white shadow-xs'
                      : 'bg-[#2f2942] text-white/60 hover:text-white hover:bg-[#37304f]'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-[#2f2942] border border-white/5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#7c5cfc] transition"
              />
            </div>
          </div>

          {/* Sub-Filters: Priority & Category */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40 text-[11px]">Filters:</span>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 rounded-md bg-[#2f2942] border border-white/5 text-white/80 text-xs focus:outline-none focus:border-[#7c5cfc]"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 rounded-md bg-[#2f2942] border border-white/5 text-white/80 text-xs focus:outline-none focus:border-[#7c5cfc]"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="feature">Feature</option>
              <option value="general">General</option>
            </select>

            {(filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterCategory('all');
                  setSearchQuery('');
                }}
                className="text-[11px] text-[#a78bfa] hover:text-[#c4b5fd] underline ml-auto"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Tickets Feed */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[#2a243a]/40 border border-white/5 space-y-3">
              <LifeBuoy className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-sm font-medium text-white/70">No tickets found</p>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try clearing your filters or search keywords.'
                  : 'You have not submitted any support tickets yet. Click "Create New Ticket" to get started.'}
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className="p-4 sm:p-5 rounded-xl bg-[#2c263d] hover:bg-[#332c47] border border-white/5 hover:border-white/10 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
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
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-[#c4b5fd] transition truncate">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between text-xs text-white/40 shrink-0 gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                  <span className="text-[#a78bfa] font-medium group-hover:underline">
                    View Thread &rarr;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTicketCreated={() => {
          router.refresh();
        }}
      />

      {/* Ticket Details & Conversation Modal */}
      {selectedTicketId && (
        <TicketConversationModal
          ticketId={selectedTicketId}
          isStaff={false}
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
