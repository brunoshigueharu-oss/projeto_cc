"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UF_LIST, newAddressSchema, type NewAddressInput } from "../_lib/checkout-schema";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type AddressFormProps = {
  onSubmit: (values: NewAddressInput) => void | Promise<void>;
  submitting: boolean;
};

/**
 * Client Component "burro": só coleta e valida o endereço. Não chama a Wix
 * nem trata erro de rede — isso é responsabilidade de `checkout-content.tsx`,
 * que centraliza o fluxo do checkout inteiro.
 */
export function AddressForm({ onSubmit, submitting }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewAddressInput>({
    resolver: zodResolver(newAddressSchema),
    defaultValues: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: undefined,
      postalCode: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
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
            <select
              id="state"
              className={SELECT_CLASS}
              defaultValue=""
              aria-invalid={errors.state ? true : undefined}
              {...register("state")}
            >
              <option value="" disabled>
                UF
              </option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
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

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-11 w-full rounded-full px-7"
        >
          {submitting ? "Processando…" : "Ir para pagamento"}
        </Button>
      </FieldGroup>
    </form>
  );
}
