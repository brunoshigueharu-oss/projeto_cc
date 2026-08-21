import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";

const PROTECTED_PATHS = ["/perfil", "/carrinho", "/checkout", "/admin"];

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  const isProtected = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!data?.claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Checagem extra só pra `/admin/*` — role não está no JWT, então isso
  // exige uma query; as demais rotas protegidas não pagam esse custo.
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  if (data?.claims && isAdminPath) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.claims.sub)
      .single();

    if (error) {
      console.error("[proxy] admin role check failed:", error);
    }

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
