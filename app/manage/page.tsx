import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isStaffUser } from '@/lib/auth/roles';
import { StaffDashboardView } from '@/components/tickets/StaffDashboardView';
import type { Ticket } from '@/lib/types/ticket';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Ensure only management/staff can view this page
  if (!isStaffUser(user)) {
    redirect('/dashboard');
  }

  // Fetch all tickets across the system for staff review
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <StaffDashboardView
      userEmail={user.email || 'staff@smartdesk.app'}
      initialTickets={(tickets || []) as Ticket[]}
    />
  );
}
