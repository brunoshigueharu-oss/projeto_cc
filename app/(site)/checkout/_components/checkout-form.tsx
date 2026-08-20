"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/cart/cart-context";
import { formatPriceClient } from "@/lib/cart/format-price";
import type { Tables } from "@/lib/supabase/database.types";
import { createOrder } from "../_actions/create-order";
import { UF_LIST, newAddressSchema, type NewAddressInput } from "../_lib/checkout-schema";

type CheckoutFormProps = {
  savedAddresses: readonly Tables<"addresses">[];
};

export function CheckoutForm({ savedAddresses }: CheckoutFormProps) {
  const router = useRouter();
  const { resolvedLines, subtotalCents, clear } = useCart();

  const defaultAddress =
    savedAddresses.find((address) => address.is_default) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    defaultAddress?.id ?? "new",
  );
  const [result, setResult] = useState<{ message: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewAddressInput>({
    resolver: zodResolver(newAddressSchema),
    defaultValues: {
      recipientName: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: undefined,
      postalCode: "",
      saveAsDefault: false,
    },
  });

  async function onSubmit(values: NewAddressInput) {
    const items = resolvedLines.map((line) => ({
      item_type: line.type,
      book_slug: line.type === "book" ? line.slug : null,
      combo_slug: line.type === "combo" ? line.slug : null,
      title_snapshot: line.title,
      quantity: line.quantity,
      unit_price_cents: line.unitPriceCents,
      total_price_cents: line.unitPriceCents * line.quantity,
    }));

    const response = await createOrder({
      addressId: selectedAddressId === "new" ? undefined : selectedAddressId,
      newAddress: selectedAddressId === "new" ? values : undefined,
      items,
    });

    if (!response.success) {
      setResult({ message: response.message ?? "Não foi possível concluir o pedido." });
      return;
    }

    clear();
    router.push(`/perfil?pedido=${response.orderNumber}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {savedAddresses.length > 0 ? (
          <Field>
            <FieldLabel>Endereço de entrega</FieldLabel>
            <RadioGroup
              value={selectedAddressId}
              onValueChange={(value) => setSelectedAddressId(value as string)}
            >
              {savedAddresses.map((address) => (
                <FieldLabel key={address.id} htmlFor={`address-${address.id}`}>
                  <Field orientation="horizontal">
                    <RadioGroupItem value={address.id} id={`address-${address.id}`} />
                    <span>
                      {address.street}, {address.number} — {address.city}/{address.state}
                    </span>
                  </Field>
                </FieldLabel>
              ))}
              <FieldLabel htmlFor="address-new">
                <Field orientation="horizontal">
                  <RadioGroupItem value="new" id="address-new" />
                  <span>Usar um novo endereço</span>
                </Field>
              </FieldLabel>
            </RadioGroup>
          </Field>
        ) : null}

        {selectedAddressId === "new" ? (
          <>
            <Field>
              <FieldLabel htmlFor="recipientName">Nome do destinatário</FieldLabel>
              <Input
                id="recipientName"
                autoComplete="name"
                aria-invalid={errors.recipientName ? true : undefined}
                {...register("recipientName")}
              />
              <FieldError errors={[errors.recipientName]} />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="street">Rua</FieldLabel>
                <Input
                  id="street"
                  autoComplete="address-line1"
                  aria-invalid={errors.street ? true : undefined}
                  {...register("street")}
                />
                <FieldError errors={[errors.street]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="number">Número</FieldLabel>
                <Input
                  id="number"
                  aria-invalid={errors.number ? true : undefined}
                  {...register("number")}
                />
                <FieldError errors={[errors.number]} />
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="complement">Complemento</FieldLabel>
              <Input id="complement" {...register("complement")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
              <Input
                id="neighborhood"
                aria-invalid={errors.neighborhood ? true : undefined}
                {...register("neighborhood")}
              />
              <FieldError errors={[errors.neighborhood]} />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="city">Cidade</FieldLabel>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  aria-invalid={errors.city ? true : undefined}
                  {...register("city")}
                />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="state">UF</FieldLabel>
                <Select
                  onValueChange={(value) =>
                    setValue("state", value as NewAddressInput["state"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="state" aria-invalid={errors.state ? true : undefined}>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.state]} />
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="postalCode">CEP</FieldLabel>
              <Input
                id="postalCode"
                autoComplete="postal-code"
                inputMode="numeric"
                aria-invalid={errors.postalCode ? true : undefined}
                {...register("postalCode")}
              />
              <FieldError errors={[errors.postalCode]} />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="saveAsDefault"
                onCheckedChange={(checked) => setValue("saveAsDefault", checked === true)}
              />
              <FieldLabel htmlFor="saveAsDefault">Salvar como endereço padrão</FieldLabel>
            </Field>
          </>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-mono text-xl font-bold text-foreground tabular-nums">
            {formatPriceClient(subtotalCents)}
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full"
        >
          {isSubmitting ? "Finalizando…" : "Confirmar pedido"}
        </Button>

        {result ? (
          <p role="status" aria-live="polite" className="text-sm text-destructive">
            {result.message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
