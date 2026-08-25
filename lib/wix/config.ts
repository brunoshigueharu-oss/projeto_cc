// IDs públicos do headless client do site "Hocus Pocus (cópia)" — não são
// segredo (o client id só autentica visitantes/membros via OAuth2, nunca dá
// acesso admin). Ver docs/superpowers/specs/2026-08-23-wix-members-auth-migration-design.md.
export const WIX_CLIENT_ID = "83747f22-4b42-446b-9597-2afb8249c84b";
export const WIX_METASITE_ID = "14110309-77c6-4b74-b8af-893fe1f1e12c";

// App ID fixo da Wix Stores — não muda por site, usado em
// `catalogReference.appId` nas chamadas de carrinho/checkout (lib/wix/ecom.ts).
export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
