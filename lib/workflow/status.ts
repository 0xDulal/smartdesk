import type { TicketStatus } from '../types/ticket';

export interface TransitionRule {
  allowedNext: TicketStatus[];
  requiresStaff: boolean;
}

export const STATUS_TRANSITIONS: Record<TicketStatus, TransitionRule> = {
  open: {
    allowedNext: ['in_progress', 'closed'],
    requiresStaff: false, // Customer can close their own ticket
  },
  in_progress: {
    allowedNext: ['resolved', 'open'],
    requiresStaff: true, // Only staff can resolve or re-open from in_progress
  },
  resolved: {
    allowedNext: ['closed', 'open'],
    requiresStaff: false, // Customer can accept resolution (close) or reopen if issue persists
  },
  closed: {
    allowedNext: ['open'], // Reopening closed ticket
    requiresStaff: false,
  },
};

/**
 * Validates whether a status transition is legally permitted for a user's role.
 */
export function canTransitionStatus(
  from: TicketStatus,
  to: TicketStatus,
  isStaff: boolean
): { allowed: boolean; reason?: string } {
  if (from === to) {
    return { allowed: true };
  }

  const rule = STATUS_TRANSITIONS[from];
  if (!rule || !rule.allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `Cannot transition status directly from '${from}' to '${to}'`,
    };
  }

  // Non-staff can only perform actions that do not strictly require staff privileges
  if (!isStaff && rule.requiresStaff) {
    return {
      allowed: false,
      reason: `Staff privileges are required to transition ticket from '${from}' to '${to}'`,
    };
  }

  // Special constraint: customers cannot move an open ticket directly to in_progress
  if (!isStaff && from === 'open' && to === 'in_progress') {
    return {
      allowed: false,
      reason: 'Only support agents can pick up a ticket to start progress',
    };
  }

  return { allowed: true };
}
