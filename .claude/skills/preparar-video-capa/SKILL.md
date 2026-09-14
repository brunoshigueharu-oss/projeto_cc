---
name: preparar-video-capa
description: >
  Transforma um vídeo bruto do fornecedor 3D (.mov, geralmente com canal
  alpha, nomeado tipo `necro_0001-0200-2.mov`) em vídeo de capa pronto pro
  site — fundo exato (#ffffff, o branco do site), color range correto
  (sem "seam"/mancha nas bordas) e arquivo leve. Use quando o
  usuário mandar um `.mov` novo pra virar `coverVideoSrc`,
  pedir pra "preparar"/"otimizar"/"consertar o fundo" de um vídeo de livro, ou
  mencionar reenvio de vídeo depois de trocar o export do Premiere.
---

# Preparar vídeo de capa

Pega o `.mov` bruto que a editora/fornecedor 3D manda e gera o `.mp4`
final do catálogo — sem passar pelo exportador H.264 do Premiere, que **não
tem opção de full range** (confirmado: comunidade Adobe, sem solução oficial
até hoje) e por isso sempre grava o fundo mais claro que o hex pretendido.

Pré-requisito: `ffmpeg`/`ffprobe` em `~/.local/bin` (compilado localmente,
sem Homebrew nesta máquina — se sumirem do PATH, é isso que quebrou).

## 1. Reunir o que falta

Pergunte o que não estiver claro pela conversa (não invente):

- **Caminho do `.mov`** de origem (geralmente `~/Downloads/<algo>_0001-0200*.mov`)
- **`slug`** do livro em `lib/data/books.ts` (define o nome do arquivo de saída)

O site não tem modo escuro: não gere variante `-dark` mesmo que o fornecedor
mande uma versão de fundo preto.

## 2. Diagnosticar a origem

```bash
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,color_range \
  -show_entries format=duration -of default=noprint_wrappers=0 "<origem>.mov"
```

O `pix_fmt` decide o caminho:

| `pix_fmt` | Significa | Caminho |
|---|---|---|
| `argb`, `rgba`, `yuva*` (tem canal alfa) | Render 3D com fundo transparente | **2A** — compor direto sobre o hex do site |
| sem alfa (`yuv420p` etc.) | Já veio composto numa cor (ex: export antigo do Premiere) | **2B** — só corrigir o range (se a cor for branca; outra cor exige reenvio com alfa) |

Confirme o alfa é real (não é 100% opaco por acaso) antes de assumir 2A:

```bash
ffmpeg -y -v error -i "<origem>.mov" -ss 4 -vframes 1 -vf "format=rgba" \
  -f rawvideo -pix_fmt rgba /tmp/frame.raw
python3 -c "
w=<width>; h=<height>
d=open('/tmp/frame.raw','rb').read()
def px(x,y):
    i=(y*w+x)*4; return d[i:i+4]
print('canto:', px(5,5), '| centro:', px(w//2,h//2))
"
# canto deve dar alpha=0 (transparente), centro alpha=255 (opaco)
```

## 2A. Compor direto sobre o fundo (caminho preferido)

Sem redimensionar — a resolução nativa do render já é maior que o tamanho
exibido em tela (capa do hero tem ~320-640px de largura na prática), então
manter nativo já entrega leveza sem perda visível. Use `W`/`H`/`FPS` do
`ffprobe` do passo 2.

```bash
SRC="<origem>.mov"
SLUG="<slug>"
DEST="public/videos/livros"

# #ffffff, igual a --background do :root em app/globals.css
ffmpeg -y -i "$SRC" \
  -f lavfi -i "color=c=white:s=${W}x${H}:r=${FPS}" \
  -filter_complex "[1:v][0:v]overlay=shortest=1:format=auto,format=yuv420p" \
  -color_range pc -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:v h264_videotoolbox -b:v 5M -profile:v high -an \
  "$DEST/${SLUG}.mp4"
```

## 2B. Só corrigir o range (origem já composta, sem alfa)

Use quando `ffprobe` mostrar `color_range=tv` numa origem que já está sobre a
cor final (não redistribui pixel nenhum além de destrinchar o range —
**nunca** use o bitstream filter `h264_metadata` pra só trocar a tag sem
reprocessar: o valor bruto continua errado, só muda o rótulo e piora a
consistência).

```bash
ffmpeg -i "<origem>" -vf "scale=in_range=tv:out_range=full" \
  -color_range pc -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:v h264_videotoolbox -b:v 5M -an \
  "$DEST/${SLUG}.mp4"
```

Se `color_range` já vier `pc`, o arquivo não tem o bug — só reencode se o
objetivo for reduzir tamanho.

`-b:v 5M` é ponto de partida (rendeu ~5MB pra um 992×1216 de 8s nos testes).
Ajuste conforme a resolução/duração real e compare tamanho final com o
arquivo que está sendo substituído.

## 3. Validar antes de gravar em `public/`

Sempre nessa ordem, no arquivo gerado:

```bash
# 1. range tem que ser "pc"
ffprobe -v error -select_streams v:0 -show_entries stream=color_range -of default=nk=1:nw=1 "$OUT"

# 2. pixel bruto do canto tem que bater com o hex (± 1 por arredondamento do
#    codec é normal; diferença grande = algo errado)
ffmpeg -y -v error -i "$OUT" -vframes 1 -vf "crop=6:6:5:5,format=rgb24" \
  -f rawvideo -pix_fmt rgb24 - | xxd | head -1
# espera ff ff ff ff... (ou fe, por 1 unidade)

# 3. conferência visual — extrai um frame do meio e olha a arte, não só o canto
ffmpeg -y -v error -i "$OUT" -ss 4 -vframes 1 /tmp/frame-check.png
```

Leia o PNG antes de considerar pronto — já aconteceu de o corte/composição
ficar tecnicamente correto no canto e errado no meio do frame.

## 4. Ligar no catálogo

Em `lib/data/books.ts`, no título do `slug`:

```ts
coverVideoSrc: "/videos/livros/<slug>.mp4",
```

Se o enquadramento do render ficar "menor"/"maior" que os vizinhos do
catálogo, ajuste `coverVideoScale` (ver comentário do campo em
`components/book-cover.tsx`) — não reexporte o vídeo só por causa de escala.

Depois, `npm run dev` e confira a página do livro antes de considerar pronto.
