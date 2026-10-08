"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

type QuantityInputProps = {
  /** Título do item, para o nome acessível do campo. */
  title: string;
  quantity: number;
  onCommit: (quantity: number) => void;
};

function parseQuantity(text: string): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const quantity = Number(text);
  return quantity >= 1 ? quantity : null;
}

/**
 * Campo de quantidade de uma linha do carrinho. Guarda o texto digitado num
 * rascunho próprio, para que apagar o número antes de redigitar não seja
 * desfeito na hora: só valores válidos (inteiro ≥ 1) chegam ao carrinho, e um
 * rascunho vazio ou inválido volta ao último valor válido ao sair do campo.
 */
export function QuantityInput({ title, quantity, onCommit }: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function handleChange(text: string) {
    setDraft(text);
    const parsed = parseQuantity(text);
    if (parsed !== null && parsed !== quantity) onCommit(parsed);
  }

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={1}
      step={1}
      aria-label={`Quantidade de ${title}`}
      value={draft ?? String(quantity)}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") setDraft(null);
      }}
      className="h-9 w-16 text-center"
    />
  );
}
