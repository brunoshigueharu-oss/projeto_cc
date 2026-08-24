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
import { sendPasswordResetEmail } from "@/lib/wix/members-auth";
import { esqueciSenhaSchema, type EsqueciSenhaInput } from "../_lib/esqueci-senha-schema";

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
    const redirectUri = `${window.location.origin}/atualizar-senha`;
    try {
      await sendPasswordResetEmail(values.email, redirectUri);
    } catch (e) {
      // Mensagem sempre igual, mesmo em erro — não revela se o e-mail existe.
      // Logado pra debug (allow-list de redirect, chave errada, etc.) sem vazar nada ao usuário.
      console.error(e);
    }
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
