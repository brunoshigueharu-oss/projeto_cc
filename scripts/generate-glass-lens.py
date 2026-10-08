#!/usr/bin/env python3
"""Gera os mapas do vidro (`public/images/glass/`) usados por
`components/glass-lens-filter.tsx`.

Receita de https://kube.io/blog/liquid-glass-css-svg/: a borda do vidro é uma
superfície com perfil de squircle convexo, a normal sai da derivada do perfil
e o desvio de cada raio vem da lei de Snell (ar n=1 -> vidro n=1.5).

Para cada formato saem dois PNGs:
  lens-<forma>.png      deslocamento — R = eixo X, G = eixo Y, 128 = neutro
  specular-<forma>.png  luz de aro, somada à refração com `feBlend screen`

Uso: python3 scripts/generate-glass-lens.py   (requer numpy e Pillow)
O script imprime o `scale` de cada lente; se mudar, atualize LENSES no
componente.
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public/images/glass"

REFRACTIVE_INDEX = 1.5
# Em frações do raio da peça. Controles pequenos (32-56px) precisam de bisel
# largo: com o bisel fino do artigo a faixa refratada teria 2-3px.
BEZEL = 0.75
# Espessura baixa de propósito: o vidro do site é discreto, só um leve
# desvio no bisel. Acima de ~0.6 a peça passa a chamar mais atenção que a
# mídia que está atrás.
THICKNESS = 0.28
# Luz vindo de cima-esquerda; o aro oposto acende junto, como no vidro real.
LIGHT_ANGLE = np.radians(-120)
SPECULAR_WIDTH = 0.09
SPECULAR_OPACITY = 0.2


def squircle(x):
    """Perfil convexo: y = (1 - (1 - x)^4)^(1/4), x = distância até a borda."""
    return (1 - (1 - x) ** 4) ** 0.25


def generate(name, width, height):
    radius = min(width, height) / 2
    y, x = np.mgrid[0:height, 0:width].astype(float)
    x += 0.5
    y += 0.5
    cx, cy = width / 2, height / 2

    # Distância com sinal até a borda do retângulo arredondado (< 0 dentro).
    qx = np.abs(x - cx) - (cx - radius)
    qy = np.abs(y - cy) - (cy - radius)
    sdf = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - radius
    grad_y, grad_x = np.gradient(sdf)
    norm = np.hypot(grad_x, grad_y) + 1e-6
    out_x, out_y = grad_x / norm, grad_y / norm  # normal 2D apontando para fora

    # Posição dentro do bisel: 0 na borda, 1 onde o vidro fica plano.
    t = np.clip(-sdf / (BEZEL * radius), 1e-4, 1)
    delta = 1e-3
    slope = (squircle(np.clip(t + delta, 0, 1)) - squircle(np.clip(t - delta, 0, 1))) / (2 * delta)
    slope *= THICKNESS / BEZEL

    # Snell: o raio chega vertical, então o ângulo de incidência é a inclinação
    # da superfície. O desvio lateral é o que ele anda até o fundo do vidro.
    incidence = np.arctan(slope)
    refraction = np.arcsin(np.sin(incidence) / REFRACTIVE_INDEX)
    depth = squircle(t) * THICKNESS * radius
    shift = depth * np.tan(incidence - refraction)
    shift[sdf > 0] = 0
    shift[t >= 1] = 0

    max_shift = shift.max()
    magnitude = shift / max_shift
    # Superfície convexa dobra o raio para dentro: amostra em direção ao centro.
    red = 128 - out_x * magnitude * 127
    green = 128 - out_y * magnitude * 127
    lens = np.stack([red, green, np.full_like(red, 128)], -1)
    Image.fromarray(lens.round().clip(0, 255).astype("uint8")).save(OUT / f"lens-{name}.png", optimize=True)

    edge = np.exp(-((-sdf / (SPECULAR_WIDTH * radius)) ** 2))
    edge[sdf > 0] = 0
    facing = np.abs(out_x * np.cos(LIGHT_ANGLE) + out_y * np.sin(LIGHT_ANGLE)) ** 2
    light = (edge * facing * SPECULAR_OPACITY * 255).round().clip(0, 255).astype("uint8")
    Image.fromarray(np.stack([light] * 3, -1)).save(OUT / f"specular-{name}.png", optimize=True)

    # `scale` do feDisplacementMap em objectBoundingBox: fração da caixa que
    # corresponde a 255 no mapa (o deslocamento máximo é metade disso).
    reference = np.sqrt((width**2 + height**2) / 2)
    print(f"{name}: deslocamento máx. {max_shift / radius:.2f} raio -> scale {2 * max_shift / reference:.2f}")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    generate("circle", 128, 128)
