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
    return {
      success: false,
      message: "E-mail ou senha incorretos.",
    };
  }

  // Só aceita redirect relativo (começando com "/") — evita open redirect.
  redirect(redirectTo?.startsWith("/") ? redirectTo : "/perfil");
}
