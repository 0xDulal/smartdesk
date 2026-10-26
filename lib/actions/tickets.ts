'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isStaffUser } from '@/lib/auth/roles';
import {
  createTicketSchema,
  updateTicketSchema,
  deleteTicketSchema,
  suggestAiClassificationSchema,
  updateTicketStatusSchema,
  addTicketMessageSchema,
} from '@/lib/validations/ticket';
import { calculateSlaDueDate } from '@/lib/workflow/sla';
import { canTransitionStatus } from '@/lib/workflow/status';
import { triageTicket, type AiTriageResult } from '@/lib/ai/triage';
import type { Ticket, TicketMessage, TicketStatus } from '@/lib/types/ticket';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new support ticket, running AI triage and SLA deadline computation.
 */
export async function createTicketAction(formData: FormData): Promise<ActionResponse<Ticket>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category') || 'general',
    priority: formData.get('priority') || 'medium',
  };

  const parsed = createTicketSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Invalid ticket submission data',
    };
  }

  const { title, description } = parsed.data;

  // Run AI triage for smart classification and reply drafting
  const triage = await triageTicket(title, description);

  // Use AI classification if user selected defaults, or keep user override
  const finalCategory = parsed.data.category === 'general' ? triage.category : parsed.data.category;
  const finalPriority = parsed.data.priority === 'medium' ? triage.priority : parsed.data.priority;

  const slaDueAt = calculateSlaDueDate(finalPriority);

  const { data: ticket, error: dbError } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      user_email: user.email || 'customer@smartdesk.app',
      title,
      description,
      category: finalCategory,
      priority: finalPriority,
      status: 'open',
      ai_summary: triage.summary,
      ai_confidence: triage.confidence,
      ai_suggested_reply: triage.suggestedReply,
      sla_due_at: slaDueAt.toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/manage');
  revalidatePath('/menage');

  return { success: true, data: ticket as Ticket };
}

/**
 * Updates a ticket's status while validating role-based workflow rules.
 */
export async function updateTicketStatusAction(
  ticketId: string,
  newStatus: TicketStatus
): Promise<ActionResponse<Ticket>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const parsed = updateTicketStatusSchema.safeParse({ ticketId, status: newStatus });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input.' };
  }

  // Fetch current ticket
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError || !currentTicket) {
    return { success: false, error: 'Ticket not found.' };
  }

  const isStaff = isStaffUser(user);
  const isOwner = currentTicket.user_id === user.id;

  if (!isStaff && !isOwner) {
    return { success: false, error: 'You do not have permission to modify this ticket.' };
  }

  // Validate workflow rules
  const transitionCheck = canTransitionStatus(currentTicket.status, newStatus, isStaff);
  if (!transitionCheck.allowed) {
    return { success: false, error: transitionCheck.reason || 'Invalid status transition.' };
  }

  const { data: updated, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/manage');
  revalidatePath('/menage');

  return { success: true, data: updated as Ticket };
}

/**
 * Adds a message or reply to a ticket thread.
 */
export async function addTicketMessageAction(
  ticketId: string,
  messageText: string
): Promise<ActionResponse<TicketMessage>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const parsed = addTicketMessageSchema.safeParse({ ticketId, message: messageText });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid message.' };
  }

  const isStaff = isStaffUser(user);

  // Verify access
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    return { success: false, error: 'Ticket not found.' };
  }

  if (!isStaff && ticket.user_id !== user.id) {
    return { success: false, error: 'Unauthorized to reply to this ticket.' };
  }

  const { data: createdMessage, error: insertError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      user_email: user.email || (isStaff ? 'staff@smartdesk.app' : 'user@smartdesk.app'),
      is_staff: isStaff,
      message: parsed.data.message,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // If staff replies and status was open, automatically shift to in_progress
  if (isStaff && ticket.status === 'open') {
    await supabase
      .from('tickets')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', ticketId);
  } else {
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);
  }

  revalidatePath('/dashboard');
  revalidatePath('/manage');
  revalidatePath('/menage');

  return { success: true, data: createdMessage as TicketMessage };
}

/**
 * Loads a ticket and its associated messages.
 */
export async function getTicketDetailsAction(ticketId: string): Promise<ActionResponse<{
  ticket: Ticket;
  messages: TicketMessage[];
}>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    return { success: false, error: 'Ticket not found.' };
  }

  const isStaff = isStaffUser(user);
  if (!isStaff && ticket.user_id !== user.id) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    return { success: false, error: messagesError.message };
  }

  return {
    success: true,
    data: {
      ticket: ticket as Ticket,
      messages: (messages || []) as TicketMessage[],
    },
  };
}

/**
 * Provides interactive category and priority suggestions for user review before submission.
 */
export async function suggestTicketClassificationAction(
  title: string,
  description: string
): Promise<ActionResponse<AiTriageResult>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const parsed = suggestAiClassificationSchema.safeParse({ title, description });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Please provide a valid title and description.',
    };
  }

  try {
    const triage = await triageTicket(parsed.data.title, parsed.data.description);
    return { success: true, data: triage };
  } catch {
    return { success: false, error: 'AI service temporarily unavailable. You can set fields manually.' };
  }
}

/**
 * Updates an existing ticket's core details (title, description, category, priority).
 */
export async function updateTicketAction(formData: FormData): Promise<ActionResponse<Ticket>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const rawData = {
    ticketId: formData.get('ticketId'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    priority: formData.get('priority'),
  };

  const parsed = updateTicketSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Invalid ticket details.',
    };
  }

  const { ticketId, title, description, category, priority } = parsed.data;

  // Verify ownership or staff role
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError || !currentTicket) {
    return { success: false, error: 'Ticket not found.' };
  }

  const isStaff = isStaffUser(user);
  if (!isStaff && currentTicket.user_id !== user.id) {
    return { success: false, error: 'You do not have permission to edit this ticket.' };
  }

  // Recalculate SLA due date if priority changed
  const slaDueAt =
    priority !== currentTicket.priority
      ? calculateSlaDueDate(priority).toISOString()
      : currentTicket.sla_due_at;

  const { data: updated, error: updateError } = await supabase
    .from('tickets')
    .update({
      title,
      description,
      category,
      priority,
      sla_due_at: slaDueAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/manage');
  revalidatePath('/menage');

  return { success: true, data: updated as Ticket };
}

/**
 * Deletes a ticket with ownership verification.
 */
export async function deleteTicketAction(ticketId: string): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const parsed = deleteTicketSchema.safeParse({ ticketId });
  if (!parsed.success) {
    return { success: false, error: 'Invalid ticket ID.' };
  }

  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('id, user_id')
    .eq('id', parsed.data.ticketId)
    .single();

  if (fetchError || !currentTicket) {
    return { success: false, error: 'Ticket not found.' };
  }

  const isStaff = isStaffUser(user);
  if (!isStaff && currentTicket.user_id !== user.id) {
    return { success: false, error: 'You do not have permission to delete this ticket.' };
  }

  const { error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .eq('id', parsed.data.ticketId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/manage');
  revalidatePath('/menage');

  return { success: true, data: { id: parsed.data.ticketId } };
}
