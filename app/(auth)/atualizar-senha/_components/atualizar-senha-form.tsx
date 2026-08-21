"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { atualizarSenha } from "../_actions/atualizar-senha";
import {
  atualizarSenhaSchema,
  type AtualizarSenhaInput,
} from "../_lib/atualizar-senha-schema";

export function AtualizarSenhaForm() {
  const [result, setResult] = useState<FormResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AtualizarSenhaInput>({
    resolver: zodResolver(atualizarSenhaSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: AtualizarSenhaInput) {
    const response = await atualizarSenha(values);
    // Em caso de sucesso a action já faz redirect() e não retorna aqui.
    if (!response.success) {
      setResult({ ok: false, message: response.message ?? "Não foi possível atualizar a senha." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <FieldDescription>Pelo menos 8 caracteres.</FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirmar nova senha</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? true : undefined}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Salvando…" : "Salvar nova senha"}
          </Button>

          <FormStatus result={result} />
        </div>
      </FieldGroup>
    </form>
  );
}
