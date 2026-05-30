import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { AppRole } from "@/lib/constants";
import { ROLE_HOME_ROUTE } from "@/lib/constants";

const AUTH_ROUTES = ["/login", "/register"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route);
}

function isPath(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`);
}

function allowedRolesForPath(pathname: string): AppRole[] | null {
  if (isPath(pathname, "/admin")) return ["admin"];
  if (isPath(pathname, "/doctor")) return ["doctor"];
  if (isPath(pathname, "/caregiver")) return ["caregiver"];
  if (isPath(pathname, "/station")) return ["station"];

  if (isPath(pathname, "/assistant")) return ["admin", "doctor", "caregiver"];
  if (isPath(pathname, "/alerts")) return ["admin", "doctor", "caregiver"];
  if (isPath(pathname, "/settings")) return ["admin", "doctor", "caregiver"];

  return null;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const pathname = request.nextUrl.pathname;
  const allowedRoles = allowedRolesForPath(pathname);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (allowedRoles) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  const role = appUser?.role as AppRole | undefined;

  if (isAuthRoute(pathname) && role) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = ROLE_HOME_ROUTE[role];
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (!allowedRoles) {
    return response;
  }

  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "missing-profile");
    return NextResponse.redirect(loginUrl);
  }

  if (!allowedRoles.includes(role)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = ROLE_HOME_ROUTE[role];
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};