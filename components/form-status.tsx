export type FormResult = {
  ok: boolean;
  message: string;
};

/** Mensagem de resultado de submit, reaproveitada pelos formulários com React Hook Form + Server Action. */
export function FormStatus({ result }: { result: FormResult | null }) {
  if (!result) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={result.ok ? "text-sm text-foreground" : "text-sm text-destructive"}
    >
      {result.message}
    </p>
  );
}
