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
import { register as wixRegister, verifyEmail, MemberAuthError } from "@/lib/wix/members-auth";
import { cadastroSchema, type CadastroInput } from "../_lib/cadastro-schema";

type Phase = "form" | "verify" | "pending";

export function CadastroForm() {
  const [result, setResult] = useState<FormResult | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const { refresh } = useMember();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: CadastroInput) {
    setResult(null);
    try {
      const res = await wixRegister(values.email, values.password, { nickname: values.name });
      if (res.state === "SUCCESS") {
        await refresh();
        router.push("/perfil");
        return;
      }
      if (res.state === "REQUIRE_EMAIL_VERIFICATION") {
        setStateToken(res.stateToken ?? null);
        setPhase("verify");
        return;
      }
      if (res.state === "REQUIRE_OWNER_APPROVAL") {
        setPhase("pending");
        return;
      }
    } catch (e) {
      if (e instanceof MemberAuthError && e.code === "emailAlreadyExists") {
        setResult({ ok: false, message: "Este e-mail já tem cadastro. Tente entrar." });
      } else {
        setResult({ ok: false, message: "Não foi possível criar sua conta. Tente novamente." });
      }
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!stateToken) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await verifyEmail(code, stateToken);
      if (res.state === "SUCCESS") {
        await refresh();
        router.push("/perfil");
        return;
      }
      setResult({ ok: false, message: "Código inválido. Confira e tente novamente." });
    } catch {
      setResult({ ok: false, message: "Código inválido. Confira e tente novamente." });
    } finally {
      setVerifying(false);
    }
  }

  if (phase === "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        Seu cadastro está pendente de aprovação. Você poderá entrar assim que
        for aprovado.
      </p>
    );
  }

  if (phase === "verify") {
    return (
      <form onSubmit={onSubmitCode}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="code">Código de verificação</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Enviamos um código de 6 dígitos para o seu e-mail.
            </p>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={verifying} className="h-11 rounded-full px-7">
              {verifying ? "Confirmando…" : "Confirmar"}
            </Button>
            <FormStatus result={result} />
          </div>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input id="name" autoComplete="name" aria-invalid={errors.name ? true : undefined} {...registerField("name")} />
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
            {...registerField("email")}
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
            {...registerField("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-7">
            {isSubmitting ? "Criando conta…" : "Criar conta"}
          </Button>
          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
