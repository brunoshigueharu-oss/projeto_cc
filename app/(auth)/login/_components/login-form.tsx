// app/(auth)/login/_components/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { useMember } from "@/lib/wix/member-context";
import { login, MemberAuthError } from "@/lib/wix/members-auth";
import { VerifyEmailForm } from "../../_components/verify-email-form";
import { loginSchema, type LoginInput } from "../_lib/login-schema";

type Phase = "form" | "verify" | "pending";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [result, setResult] = useState<FormResult | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [stateToken, setStateToken] = useState<string | null>(null);
  const router = useRouter();
  const { refresh } = useMember();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function enter() {
    await refresh();
    const safeRedirect = redirectTo && /^\/(?!\/|\\)/.test(redirectTo) ? redirectTo : "/perfil";
    router.push(safeRedirect);
  }

  function backToForm() {
    setResult(null);
    setStateToken(null);
    setPhase("form");
  }

  async function onSubmit(values: LoginInput) {
    setResult(null);
    try {
      const res = await login(values.email, values.password);
      if (res.state === "SUCCESS") {
        await enter();
        return;
      }
      // Cadastro interrompido antes do código: o login é o único lugar onde
      // a pessoa reencontra essa etapa, então ela é concluída aqui mesmo.
      if (res.state === "REQUIRE_EMAIL_VERIFICATION") {
        setStateToken(res.stateToken ?? null);
        setPhase("verify");
        return;
      }
      setPhase("pending");
    } catch (e) {
      if (e instanceof MemberAuthError && e.code === "invalidCredentials") {
        setResult({ ok: false, message: "E-mail ou senha incorretos." });
      } else {
        console.error(e);
        setResult({ ok: false, message: "Não foi possível entrar. Tente novamente." });
      }
    }
  }

  if (phase === "verify") {
    return (
      <VerifyEmailForm
        stateToken={stateToken}
        onVerified={enter}
        onPendingApproval={() => setPhase("pending")}
        onRestart={backToForm}
        restartLabel="Voltar ao login"
      />
    );
  }

  if (phase === "pending") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="status" className="text-sm text-muted-foreground">
          Seu cadastro está aguardando aprovação. Você poderá entrar assim que
          for aprovado.
        </p>
        <Button type="button" variant="outline" size="lg" onClick={backToForm} className="h-11 rounded-full px-7">
          Voltar ao login
        </Button>
      </div>
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

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              href="/esqueci-senha"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>

          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
