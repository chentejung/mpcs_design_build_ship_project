import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authSkipped, supabaseConfig } from "@/lib/supabase/config";

const PUBLIC_PATHS = ["/login", "/signup", "/reset-password", "/auth/"];

/** Refreshes the Supabase session and sends visitors who aren't signed in to the login page. */
export async function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  if (authSkipped()) return NextResponse.next({ request });

  const config = supabaseConfig();
  let response = NextResponse.next({ request });
  let signedIn = false;
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  }

  if (!signedIn && !isPublic && !request.nextUrl.pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
