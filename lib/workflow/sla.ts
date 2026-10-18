import type { TicketPriority, TicketStatus } from '../types/ticket';

export const SLA_HOURS_BY_PRIORITY: Record<TicketPriority, number> = {
  urgent: 4,
  high: 12,
  medium: 24,
  low: 48,
};

/**
 * Calculates the SLA due timestamp from a given start date and priority.
 */
export function calculateSlaDueDate(priority: TicketPriority, startDate: Date = new Date()): Date {
  const hours = SLA_HOURS_BY_PRIORITY[priority] ?? 24;
  const dueDate = new Date(startDate.getTime());
  dueDate.setHours(dueDate.getHours() + hours);
  return dueDate;
}

/**
 * Checks if a ticket has breached its SLA.
 */
export function isSlaBreached(slaDueAt: string | Date, currentStatus: TicketStatus): boolean {
  if (currentStatus === 'resolved' || currentStatus === 'closed') {
    return false;
  }
  const dueDate = typeof slaDueAt === 'string' ? new Date(slaDueAt) : slaDueAt;
  return new Date().getTime() > dueDate.getTime();
}

/**
 * Returns human-readable time remaining or overdue text.
 */
export function getSlaRemainingText(slaDueAt: string | Date, currentStatus: TicketStatus): {
  text: string;
  isOverdue: boolean;
} {
  if (currentStatus === 'resolved' || currentStatus === 'closed') {
    return { text: 'Completed', isOverdue: false };
  }

  const dueDate = typeof slaDueAt === 'string' ? new Date(slaDueAt) : slaDueAt;
  const diffMs = dueDate.getTime() - new Date().getTime();

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    return {
      text: overdueHours === 0 ? 'Due now' : `${overdueHours}h overdue`,
      isOverdue: true,
    };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  if (hoursRemaining < 1) {
    const minutesRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { text: `${minutesRemaining}m left`, isOverdue: false };
  }

  return { text: `${hoursRemaining}h left`, isOverdue: false };
}
