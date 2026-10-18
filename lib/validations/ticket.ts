import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(120, { message: 'Title must be 120 characters or fewer' })
    .trim(),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(2000, { message: 'Description must be 2000 characters or fewer' })
    .trim(),
  category: z.enum(['technical', 'billing', 'account', 'general', 'feature']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid({ message: 'Invalid ticket ID' }),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const addTicketMessageSchema = z.object({
  ticketId: z.string().uuid({ message: 'Invalid ticket ID' }),
  message: z
    .string()
    .min(1, { message: 'Message cannot be empty' })
    .max(2000, { message: 'Message is too long' })
    .trim(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
