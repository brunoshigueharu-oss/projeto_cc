"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  cadastroSchema,
  type CadastroInput,
  type CadastroResult,
} from "../_lib/cadastro-schema";

export async function cadastro(input: CadastroInput): Promise<CadastroResult> {
  const validation = cadastroSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Confira os campos destacados.",
      errors: z.flattenError(validation.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: { name: validation.data.name },
    },
  });

  if (error) {
    return {
      success: false,
      message:
        error.code === "email_exists"
          ? "Este e-mail já tem cadastro. Tente entrar."
          : "Não foi possível criar sua conta. Tente novamente.",
    };
  }

  return {
    success: true,
    message:
      "Quase lá! Enviamos um e-mail de confirmação — clique no link para ativar sua conta.",
  };
}
