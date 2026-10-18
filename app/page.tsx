import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaffUser } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (isStaffUser(user)) {
      redirect("/manage");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
