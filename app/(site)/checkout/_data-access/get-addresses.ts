import "server-only";

import { getAddressesForUser } from "@/lib/supabase/queries/addresses";
import { requireSession } from "@/lib/supabase/require-session";
import type { Tables } from "@/lib/supabase/database.types";

export async function getSavedAddresses(): Promise<Tables<"addresses">[]> {
  const { supabase } = await requireSession();
  return getAddressesForUser(supabase);
}
