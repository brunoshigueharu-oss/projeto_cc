import type { NextConfig } from "next";

/**
 * Cache dos assets de `public/`.
 *
 * O Next serve `public/` com `cache-control: public, max-age=0`, então o
 * navegador revalida cada vídeo e cada imagem a toda visita. Num site com
 * ~175 MB de vídeo numa página de livro, isso é um round-trip por arquivo
 * antes de qualquer pixel aparecer.
 *
 * Esses arquivos são imutáveis na prática: quando a arte muda, muda também o
 * nome (o slug do livro) ou o arquivo é substituído num deploy. `immutable`
 * faz o navegador nem perguntar. Se precisar trocar um asset mantendo o
 * nome, suba com sufixo novo (`-v2`) em vez de contar com revalidação.
 */
const CACHE_IMUTAVEL = "public, max-age=31536000, immutable";

/**
 * Headers de segurança aplicados a todas as rotas. O site roda em Docker no
 * EasyPanel, que não injeta nenhum deles (conferido em 2026-10-27).
 *
 * A CSP é só a parte que não depende de quais scripts/iframes a página
 * carrega: `frame-ancestors 'none'` impede que o site seja embutido em outra
 * página (clickjacking). O login da Wix abre um iframe *da Wix* dentro do
 * site e responde por `postMessage` — não embute o site — então não é
 * afetado. Uma CSP completa (script-src, connect-src...) precisa ser testada
 * contra o login e o checkout da Wix antes de virar regra.
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Navegadores ignoram HSTS em HTTP (localhost), então não afeta o dev.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Não anunciar o framework/versão no header `x-powered-by`.
  poweredByHeader: false,

  images: {
    // `/_next/image` otimiza sob demanda e guarda o resultado em
    // `.next/cache/images`, que vive dentro do container e some a cada
    // deploy. Com 1 ano de TTL o navegador do visitante absorve o que o
    // servidor perde — e o VPS (2 vCPUs) não repete o trabalho do sharp.
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: CACHE_IMUTAVEL }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: CACHE_IMUTAVEL }],
      },
    ];
  },
};

export default nextConfig;
