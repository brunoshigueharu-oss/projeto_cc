"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  atualizarSenhaSchema,
  type AtualizarSenhaInput,
  type AtualizarSenhaResult,
} from "../_lib/atualizar-senha-schema";

export async function atualizarSenha(
  input: AtualizarSenhaInput,
): Promise<AtualizarSenhaResult> {
  const validation = atualizarSenhaSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Confira os campos destacados.",
      errors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return {
      success: false,
      message: "Não foi possível atualizar sua senha. Peça um novo link em \"Esqueci minha senha\".",
    };
  }

  redirect("/perfil");
}
