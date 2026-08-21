"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

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
import { cadastro } from "../_actions/cadastro";
import { cadastroSchema, type CadastroInput } from "../_lib/cadastro-schema";

export function CadastroForm() {
  const [result, setResult] = useState<FormResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: CadastroInput) {
    const response = await cadastro(values);
    setResult({ ok: response.success, message: response.message ?? "" });
    if (response.success) {
      reset();
    }
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
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

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

        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
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

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Criando conta…" : "Criar conta"}
          </Button>

          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
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
