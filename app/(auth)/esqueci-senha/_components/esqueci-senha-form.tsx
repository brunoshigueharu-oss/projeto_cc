"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { esqueciSenha } from "../_actions/esqueci-senha";
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
    const response = await esqueciSenha(values);
    setResult({ ok: response.success, message: response.message ?? "" });
  }

  if (result?.ok) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-lg border border-border bg-muted px-4 py-3 font-serif text-sm text-foreground"
      >
        {result.message}
      </p>
    );
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
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Enviando…" : "Enviar link"}
          </Button>

          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
