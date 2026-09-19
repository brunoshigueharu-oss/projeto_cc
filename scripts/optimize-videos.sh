#!/usr/bin/env bash
#
# Otimiza os vídeos de `public/videos` para entrega na web.
#
# Dois problemas são corrigidos aqui:
#
# 1. `faststart` — 31 dos 53 arquivos vinham com o átomo `moov` (o índice do
#    MP4) depois do `mdat`. Nessa ordem o player precisa baixar quase o
#    arquivo inteiro antes de mostrar o primeiro frame: numa faixa de 34 MB
#    isso é a tela em branco que o site tinha.
#
# 2. bitrate de master, não de web — os exports vinham entre 11 e 15,6 Mbps
#    (`home/necroplanta.mp4`: 8 segundos, 15,6 Mbps, 16 MB). O site precisa de
#    1,4 a 2 Mbps para o mesmo resultado em tela.
#
# Cada pasta tem um perfil próprio (ver `perfil_de`), porque as capas em
# `livros/` ficam sobre o branco do site e não toleram o encode padrão — ver
# a skill `preparar-video-capa`.
#
# Uso:
#   ./scripts/optimize-videos.sh              # otimiza tudo que falta
#   ./scripts/optimize-videos.sh --dry-run    # só mostra o que faria
#   ./scripts/optimize-videos.sh public/videos/faixas   # limita a um caminho
#
# Os originais estão no git: `git checkout -- public/videos` reverte tudo.

set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=false
ALVO="public/videos"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) ALVO="$arg" ;;
  esac
done

command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado no PATH"; exit 1; }

# Marca gravada nos metadados do arquivo gerado. É assim que o script sabe o
# que já passou por aqui e fica seguro de rodar de novo (CI, novo vídeo solto
# na pasta, execução interrompida no meio).
readonly MARCA="hocus-web-v1"

# `h264_videotoolbox` (encoder de hardware da Apple) em vez de libx264: o
# ffmpeg desta máquina é compilado sem x264 (ver `preparar-video-capa`), e o
# videotoolbox entrega ~4s por vídeo contra ~60s do x264. A perda de
# qualidade por bit é real mas ficou imperceptível nos testes (SSIM 0,97-0,99).
# Devolve a lista completa de flags de encode do arquivo.
#
# ATENÇÃO ao `-maxrate` no perfil de capa: ele NÃO pode estar lá. Com
# `-maxrate`, o videotoolbox ignora na prática os flags de full range e
# devolve o branco em 248 — o mesmo resultado de não passar flag de cor
# nenhuma (medido nos dois casos). Sem ele o canto sai em 255.
perfil_de() {
  case "$1" in
    # Capas sobre o #ffffff do site. Os flags de full range são o que impede
    # o branco de cair e virar aquela mancha retangular sobre o fundo da
    # página — ver a skill `preparar-video-capa`.
    */videos/livros/*)
      echo "-vf scale=in_range=full:out_range=full" \
           "-color_range pc -color_primaries bt709 -color_trc bt709 -colorspace bt709" \
           "-b:v 2000k"
      ;;
    # Faixas em largura cheia (1920x1080, ~30s). Arte cinematográfica com
    # fundo próprio — aceita compressão agressiva, e o `-maxrate` aqui segura
    # o pico nas cenas de mais movimento.
    */videos/faixas/*)
      echo "-b:v 1600k -maxrate 2400k -bufsize 4800k"
      ;;
    # Banners do hero da home (1784x650 e as variantes -square).
    */videos/home/*)
      echo "-b:v 1400k -maxrate 2100k -bufsize 4200k"
      ;;
    *)
      echo "-b:v 1600k -maxrate 2400k -bufsize 4800k"
      ;;
  esac
}

ja_otimizado() {
  ffprobe -v error -show_entries format_tags=comment -of default=nk=1:nw=1 "$1" 2>/dev/null \
    | grep -q "$MARCA"
}

total_antes=0
total_depois=0
convertidos=0
pulados=0

while IFS= read -r -d '' src; do
  antes=$(stat -f%z "$src")

  if ja_otimizado "$src"; then
    pulados=$((pulados + 1))
    total_antes=$((total_antes + antes))
    total_depois=$((total_depois + antes))
    continue
  fi

  flags="$(perfil_de "$src")"

  if $DRY_RUN; then
    printf "  %-52s %6.1f MB  ->  %s\n" "${src#public/videos/}" \
      "$(echo "$antes/1048576" | bc -l)" "$flags"
    continue
  fi

  tmp="${src%.mp4}.tmp.mp4"

  # `-nostdin`: sem isso o ffmpeg lê o stdin do loop e engole bytes da lista
  # que o `find` está alimentando — o arquivo seguinte chega sem a primeira
  # letra do caminho.
  # shellcheck disable=SC2086 -- flags precisa expandir em argumentos
  ffmpeg -nostdin -y -v error -i "$src" \
    $flags \
    -c:v h264_videotoolbox -profile:v high -pix_fmt yuv420p \
    -an \
    -movflags +faststart \
    -metadata comment="$MARCA" \
    "$tmp"

  depois=$(stat -f%z "$tmp")
  mv "$tmp" "$src"

  total_antes=$((total_antes + antes))
  total_depois=$((total_depois + depois))
  convertidos=$((convertidos + 1))

  printf "  %-58s %6.1f MB -> %5.1f MB  (-%2.0f%%)\n" "${src#public/videos/}" \
    "$(echo "$antes/1048576" | bc -l)" \
    "$(echo "$depois/1048576" | bc -l)" \
    "$(echo "(1-$depois/$antes)*100" | bc -l)"

done < <(find "$ALVO" -name '*.mp4' -not -name '*.tmp.mp4' -print0 | sort -z)

echo
if $DRY_RUN; then
  echo "(--dry-run: nada foi alterado)"
else
  printf "%d convertidos, %d já otimizados\n" "$convertidos" "$pulados"
  printf "TOTAL: %.0f MB -> %.0f MB  (-%.0f%%)\n" \
    "$(echo "$total_antes/1048576" | bc -l)" \
    "$(echo "$total_depois/1048576" | bc -l)" \
    "$(echo "(1-$total_depois/$total_antes)*100" | bc -l)"
fi
