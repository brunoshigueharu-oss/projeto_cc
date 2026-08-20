import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables, TablesInsert } from "../database.types";

export async function getAddressesForUser(
  supabase: SupabaseClient<Database>,
): Promise<Tables<"addresses">[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type CreateAddressInput = Omit<TablesInsert<"addresses">, "profile_id">;

export async function createAddress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  input: CreateAddressInput,
): Promise<Tables<"addresses">> {
  // O índice único parcial `one_default_address_per_profile` só permite um
  // endereço com `is_default = true` por perfil — desmarca o atual antes de
  // inserir o novo, senão o insert abaixo viola a constraint.
  if (input.is_default) {
    const { error: clearDefaultError } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", profileId)
      .eq("is_default", true);

    if (clearDefaultError) throw clearDefaultError;
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...input, profile_id: profileId })
    .select()
    .single();

  if (error) throw error;
  return data;
}
