import Link from "next/link";

import { Seal } from "@/components/seal";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-16"
    >
      <Link href="/" className="mb-10 flex items-center gap-2">
        <Seal className="size-8" />
        <Wordmark className="h-6 w-auto text-foreground" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
