"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { wixErrorStatus } from "@/lib/wix/client";
import { sendPasswordResetEmail } from "@/lib/wix/members-auth";
import { esqueciSenhaSchema, type EsqueciSenhaInput } from "../_lib/esqueci-senha-schema";

const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

/**
 * Falha que não depende de qual e-mail foi digitado — sem resposta do Wix
 * (rede fora, token não emitido), instabilidade do servidor ou limite de
 * requisições. Só essas podem aparecer como erro: as demais recusas (4xx)
 * podem variar conforme a conta existir ou não, e mostrá-las revelaria isso.
 */
function isOperationalFailure(error: unknown): boolean {
  const status = wixErrorStatus(error);
  return status === undefined || status === HTTP_TOO_MANY_REQUESTS || status >= HTTP_SERVER_ERROR;
}

export function EsqueciSenhaForm() {
  const [result, setResult] = useState<FormResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaInput>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: EsqueciSenhaInput) {
    // Limpa o resultado anterior: uma confirmação antiga não pode ficar na
    // tela enquanto o novo pedido ainda não terminou.
    setResult(null);
    const redirectUri = `${window.location.origin}/atualizar-senha`;
    try {
      await sendPasswordResetEmail(values.email, redirectUri);
    } catch (e) {
      // Logado pra debug (allow-list de redirect, chave errada, etc.) sem vazar nada ao usuário.
      console.error(e);
      if (isOperationalFailure(e)) {
        setResult({
          ok: false,
          message: "Não foi possível concluir o pedido agora. Tente novamente em instantes.",
        });
        return;
      }
    }
    // Mesma mensagem para pedido aceito e para recusa do Wix — não revela se o e-mail existe.
    setResult({ ok: true, message: "Se esse e-mail tiver cadastro, enviamos um link para redefinir a senha." });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-7">
            {isSubmitting ? "Enviando…" : "Enviar link"}
          </Button>
          <FormStatus result={result} />
        </div>
      </FieldGroup>
    </form>
  );
}
