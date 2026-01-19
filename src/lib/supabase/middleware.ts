import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect Dashboard Routes
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/partner") ||
    request.nextUrl.pathname.startsWith("/broker")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-Based Access Control logic
    // Fetch user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const path = request.nextUrl.pathname;

    if (path.startsWith("/admin") && role !== "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (path.startsWith("/partner") && role !== "partner") {
      // Allow Admin to potentially view partner pages? No, strict separation for now or Admin dashboard covers it.
      // Strict for MVP.
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (path.startsWith("/broker") && role !== "broker") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Auth Redirects
  if (user && request.nextUrl.pathname === "/login") {
    // Redirect to appropriate dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "super_admin")
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (profile?.role === "partner")
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    if (profile?.role === "broker")
      return NextResponse.redirect(new URL("/broker/dashboard", request.url));
  }

  // Root Redirect
  if (request.nextUrl.pathname === "/") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "super_admin")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      if (profile?.role === "partner")
        return NextResponse.redirect(
          new URL("/partner/dashboard", request.url),
        );
      if (profile?.role === "broker")
        return NextResponse.redirect(new URL("/broker/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
