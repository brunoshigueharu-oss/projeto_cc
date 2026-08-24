import { RequireAuth } from "@/components/require-auth";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
