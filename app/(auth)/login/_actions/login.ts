"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  type LoginInput,
  type LoginResult,
} from "../_lib/login-schema";

export async function login(
  input: LoginInput,
  redirectTo?: string,
): Promise<LoginResult> {
  // Revalidação no servidor: a validação do cliente é conveniência de UX, não
  // barreira de segurança — a action pode ser chamada diretamente.
  const validation = loginSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Confira os campos destacados.",
      errors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validation.data);

  if (error) {
    // Supabase distingue "senha errada" de "e-mail ainda não confirmado" —
    // antes essa mensagem era genérica pra qualquer erro e confundia quem
    // tinha acabado de se cadastrar e ainda não clicou no link do e-mail.
    return {
      success: false,
      message:
        error.code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar — enviamos um link de confirmação no cadastro."
          : "E-mail ou senha incorretos.",
    };
  }

  // Só aceita redirect relativo (começando com "/") — evita open redirect.
  redirect(redirectTo?.startsWith("/") ? redirectTo : "/perfil");
}
