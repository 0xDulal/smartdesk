import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isStaffUser } from '@/lib/auth/roles';
import { CustomerDashboardView } from '@/components/tickets/CustomerDashboardView';
import type { Ticket } from '@/lib/types/ticket';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  if (isStaffUser(user)) {
    redirect('/manage');
  }

  // Fetch tickets belonging to this user
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <CustomerDashboardView
      userEmail={user.email || 'customer@smartdesk.app'}
      initialTickets={(tickets || []) as Ticket[]}
    />
  );
}
