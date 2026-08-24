import type { Metadata } from "next";
import Link from "next/link";

import { AdminGate } from "@/components/admin-gate";

export const metadata: Metadata = {
  title: { template: "%s | Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <span className="font-display text-lg text-foreground">Admin</span>
            <nav className="flex gap-6">
              {ADMIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {children}
        </main>
      </div>
    </AdminGate>
  );
}
