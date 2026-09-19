"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type Ref } from "react";

type LazyVideoProps = Omit<ComponentPropsWithoutRef<"video">, "src" | "preload"> & {
  src: string;
  /**
   * Quanto antes da borda da tela o vídeo começa a carregar. O padrão dá
   * meia dobra de antecedência: o arquivo chega antes do usuário rolar até
   * ele, sem entrar na disputa de banda do carregamento inicial.
   */
  rootMargin?: string;
  /** `video-banner-section.tsx` usa a ref pro botão de play/pause. */
  ref?: Ref<HTMLVideoElement>;
};

/**
 * `<video>` que só busca o arquivo quando chega perto da tela, e que pausa
 * quando sai dela.
 *
 * Existe porque uma página de livro referencia até 17 vídeos. Com `src` no
 * HTML e `autoPlay`, o navegador tentava baixar todos de uma vez — 175 MB
 * disputando a mesma banda, e a faixa do topo (a única visível) ficava
 * esperando a fila. Aqui o `src` só entra no DOM quando o
 * `IntersectionObserver` dispara, então a ordem de download passa a ser a
 * ordem em que o usuário realmente rola a página.
 *
 * O pause fora da tela é pelo mesmo motivo do lado da CPU: dezoito loops
 * decodificando ao mesmo tempo travam o scroll em máquina modesta.
 *
 * O `autoPlay` recebido NÃO é repassado ao elemento: se fosse, o navegador
 * dispararia o play sozinho assim que o `src` entrasse no DOM, por fora das
 * duas regras abaixo (escolha de quem pausou e `prefers-reduced-motion`).
 * Quem manda no play aqui é o componente.
 *
 * Para o vídeo do topo da página (hero), NÃO use este componente — ele é o
 * LCP e deve começar a baixar no primeiro byte do HTML.
 */
export function LazyVideo({
  src,
  rootMargin = "50%",
  ref,
  autoPlay = false,
  ...props
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Se o vídeo deve (voltar a) tocar quando aparecer na tela. Vira `false`
  // quando ele sai da tela já pausado — que é como o botão de pausa de
  // `video-banner-section.tsx` sobrevive a um scroll: sem isso, sair e
  // voltar da tela dava play por cima da escolha de quem pausou.
  const deveRetomar = useRef(true);

  // O observer precisa do nó aqui dentro e quem chama pode precisar dele
  // fora, então o `ref` do DOM é sempre o interno e o externo é preenchido
  // a partir dele.
  function attachRef(node: HTMLVideoElement | null) {
    videoRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mesmo tratamento de `paper-tilt-effect.tsx`: quem pediu menos
    // movimento no sistema não recebe loop nenhum. Como este componente é
    // que manda no play, a decisão mora aqui.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      deveRetomar.current = false;
    }

    // Sem suporte a IntersectionObserver o comportamento certo é o antigo
    // (carrega tudo), nunca um vídeo que não aparece. O `rAF` é só pra não
    // chamar setState direto no corpo do efeito.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShouldLoad(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          // Na primeira aparição o `src` ainda não está no DOM e este play
          // não tem o que tocar — quem cuida daquele caso é o efeito de
          // baixo. Aqui é só a reentrada de um vídeo já carregado.
          if (autoPlay && deveRetomar.current) video.play().catch(() => {});
        } else {
          // `currentSrc` vazio = ainda não carregou, e aí `paused` é true
          // por falta de arquivo, não por escolha de ninguém. Ler isso como
          // pausa do usuário faria o vídeo nunca tocar.
          if (video.currentSrc) deveRetomar.current = !video.paused;
          video.pause();
        }
      },
      { rootMargin },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin, autoPlay]);

  // O play da primeira aparição: só dá pra pedir depois que o `src` chegou
  // ao elemento, o que acontece no render disparado pelo `setShouldLoad`.
  useEffect(() => {
    if (!shouldLoad || !autoPlay || !deveRetomar.current) return;
    // `play()` rejeita quando a aba está em background ou o autoplay foi
    // bloqueado. Nada a fazer nesse caso — o vídeo é decorativo.
    videoRef.current?.play().catch(() => {});
  }, [shouldLoad, autoPlay]);

  return (
    <video
      ref={attachRef}
      // `preload="none"` vale enquanto não há `src`: impede que o navegador
      // gaste conexão com metadados de um vídeo que talvez nunca apareça.
      preload="none"
      src={shouldLoad ? src : undefined}
      {...props}
    />
  );
}
