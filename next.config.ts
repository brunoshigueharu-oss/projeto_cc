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

const nextConfig: NextConfig = {
  output: "standalone",

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
