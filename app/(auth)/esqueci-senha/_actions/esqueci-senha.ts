"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  esqueciSenhaSchema,
  type EsqueciSenhaInput,
  type EsqueciSenhaResult,
} from "../_lib/esqueci-senha-schema";

export async function esqueciSenha(
  input: EsqueciSenhaInput,
): Promise<EsqueciSenhaResult> {
  const validation = esqueciSenhaSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Confira os campos destacados.",
      errors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const supabase = await createClient();

  // Origem fixa via env, nunca derivada de headers da requisição (Host /
  // X-Forwarded-Host podem ser forjados) — esse link vai para a caixa de
  // entrada de terceiros, então um host forjado envenenaria o e-mail de
  // recuperação de senha da vítima.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/atualizar-senha`,
  });

  // Sempre retorna sucesso, mesmo se o e-mail não tiver cadastro — evita
  // revelar pra quem está tentando adivinhar quais e-mails existem na base.
  return {
    success: true,
    message: "Se esse e-mail tiver cadastro, enviamos um link para redefinir a senha.",
  };
}
