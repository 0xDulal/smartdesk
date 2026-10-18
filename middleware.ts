import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffUser } from "@/lib/auth/roles";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isManageRoute = pathname.startsWith("/manage") || pathname.startsWith("/menage");
  const isCustomerDashboard = pathname.startsWith("/dashboard");

  if (isManageRoute || isCustomerDashboard) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Not authenticated -> redirect to login
    if (error || !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectFrom", pathname);
      return NextResponse.redirect(url);
    }

    // Customer attempting to access manage route -> redirect to customer dashboard
    if (isManageRoute && !isStaffUser(user)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/manage/:path*", "/menage/:path*"],
};
