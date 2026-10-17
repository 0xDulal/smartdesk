import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#2b2738] text-white flex flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{user.email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-[#9e8cfc] hover:text-[#b4a5fc] underline cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
