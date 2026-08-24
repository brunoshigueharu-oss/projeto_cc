import "server-only";

import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

const ADMIN_API_KEY = process.env.WIX_ADMIN_API_KEY;
const ADMINS_COLLECTION_ID = "Admins";

/** Consulta a coleção `Admins` do Wix Data com a Admin API Key — nunca chamado
 * a partir do client (a chave é secreta). */
export async function isAdminEmail(email: string): Promise<boolean> {
  if (!ADMIN_API_KEY) {
    throw new Error("WIX_ADMIN_API_KEY não configurada no servidor.");
  }

  const res = await fetch(`${WIX_API_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ADMIN_API_KEY,
      "wix-site-id": WIX_METASITE_ID,
    },
    body: JSON.stringify({
      dataCollectionId: ADMINS_COLLECTION_ID,
      query: {
        filter: { email },
        paging: { limit: 1 },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Wix Data query falhou: ${res.status}`);
  }
  const data = await res.json();
  const items: unknown[] = data?.dataItems ?? [];
  return items.length > 0;
}
