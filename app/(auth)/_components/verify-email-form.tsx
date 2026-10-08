"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { verifyEmail } from "@/lib/wix/members-auth";

const CODE_LENGTH = 6;

type VerifyEmailFormProps = {
  /** Token devolvido pelo Wix junto com `REQUIRE_EMAIL_VERIFICATION`. Sem ele
   * não há como validar o código — o formulário vira uma saída de volta. */
  stateToken: string | null;
  /** E-mail confirmado e sessão criada. */
  onVerified: () => Promise<void> | void;
  /** E-mail confirmado, mas o cadastro ainda depende de aprovação. */
  onPendingApproval: () => void;
  /** Saída quando o código não serve mais (token ausente ou expirado). */
  onRestart: () => void;
  restartLabel: string;
};

/**
 * Etapa de código de verificação de e-mail, compartilhada por cadastro e
 * login: quem interrompe o cadastro antes de digitar o código só reencontra
 * essa etapa ao tentar entrar.
 */
export function VerifyEmailForm({
  stateToken,
  onVerified,
  onPendingApproval,
  onRestart,
  restartLabel,
}: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);

  const restartButton = (
    <Button type="button" variant="outline" size="lg" onClick={onRestart} className="h-11 rounded-full px-7">
      {restartLabel}
    </Button>
  );

  if (!stateToken) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="status" className="text-sm text-destructive">
          Não foi possível retomar a confirmação do seu e-mail. Tente de novo
          para receber outra chance de digitar o código.
        </p>
        {restartButton}
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent, token: string) {
    event.preventDefault();
    setIsVerifying(true);
    setResult(null);
    try {
      const response = await verifyEmail(code.trim(), token);
      if (response.state === "SUCCESS") {
        await onVerified();
        return;
      }
      if (response.state === "REQUIRE_OWNER_APPROVAL") {
        onPendingApproval();
        return;
      }
      setResult({ ok: false, message: "Código inválido ou expirado. Confira e tente novamente." });
    } catch (error) {
      console.error(error);
      setResult({ ok: false, message: "Código inválido ou expirado. Confira e tente novamente." });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event, stateToken)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="code">Código de verificação</FieldLabel>
          <p className="text-sm text-muted-foreground">
            Enviamos um código de {CODE_LENGTH} dígitos para o seu e-mail.
          </p>
          <Input
            id="code"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isVerifying} className="h-11 rounded-full px-7">
            {isVerifying ? "Confirmando…" : "Confirmar"}
          </Button>
          {restartButton}
        </div>
        <FormStatus result={result} />
      </FieldGroup>
    </form>
  );
}
