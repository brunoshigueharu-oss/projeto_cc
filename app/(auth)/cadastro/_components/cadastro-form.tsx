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
import { register as wixRegister, MemberAuthError } from "@/lib/wix/members-auth";
import { VerifyEmailForm } from "../../_components/verify-email-form";
import { cadastroSchema, type CadastroInput } from "../_lib/cadastro-schema";

type Phase = "form" | "verify" | "pending";

export function CadastroForm() {
  const [result, setResult] = useState<FormResult | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [stateToken, setStateToken] = useState<string | null>(null);
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
        setResult({ ok: false, message: "Este e-mail já tem cadastro. Entre com ele; se faltar confirmar o e-mail, você conclui por lá." });
      } else {
        setResult({ ok: false, message: "Não foi possível criar sua conta. Tente novamente." });
      }
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
      <VerifyEmailForm
        stateToken={stateToken}
        onVerified={async () => {
          await refresh();
          router.push("/perfil");
        }}
        onPendingApproval={() => setPhase("pending")}
        // O login retoma a verificação de um cadastro que ficou pela metade.
        onRestart={() => router.push("/login")}
        restartLabel="Ir para o login"
      />
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
