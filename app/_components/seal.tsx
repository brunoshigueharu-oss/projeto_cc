import { cn } from "@/lib/utils";

/**
 * Elemento de assinatura visual da marca: um selo de cera circular,
 * reaproveitado no wordmark, na hero e nos cards de universo.
 */
export function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle
        cx="20"
        cy="20"
        r="14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeDasharray="1.5 2.5"
      />
      <path
        d="M20 10.5 22.4 17.2 29.3 17.5 23.8 21.9 25.8 28.5 20 24.6 14.2 28.5 16.2 21.9 10.7 17.5 17.6 17.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
