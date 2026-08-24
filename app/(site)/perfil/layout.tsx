import { RequireAuth } from "@/components/require-auth";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
