import { RequireAuth } from "@/components/require-auth";

export default function CarrinhoLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
