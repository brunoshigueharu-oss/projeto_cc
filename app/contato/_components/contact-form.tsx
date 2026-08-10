"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "../_actions/send-message";
import {
  CONTACT_SUBJECTS,
  contactSchema,
  type ContactInput,
} from "../_lib/contact-schema";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Client Component porque React Hook Form depende de hooks.
 *
 * Nota sobre o shadcn deste projeto: o estilo `base-nova` (sobre @base-ui/react)
 * não fornece o wrapper `form` clássico com `FormField`/`FormMessage`. O
 * equivalente é `field`, cujo `FieldError` já aceita o formato de
 * `fieldState.error` do RHF — daí a composição abaixo.
 */
export function ContactForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "Enviar original",
      message: "",
      website: "",
    },
  });

  async function onSubmit(values: ContactInput) {
    const response = await sendMessage(values);
    setResult({ ok: response.success, message: response.message });
    if (response.success) {
      reset();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="voce@exemplo.com"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="subject">Assunto</FieldLabel>
          <select id="subject" className={SELECT_CLASS} {...register("subject")}>
            {CONTACT_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <FieldError errors={[errors.subject]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="message">Mensagem</FieldLabel>
          <Textarea
            id="message"
            rows={7}
            aria-invalid={errors.message ? true : undefined}
            {...register("message")}
          />
          <FieldDescription>
            Se estiver enviando um original, conte em que universo ele se
            encaixaria e por quê.
          </FieldDescription>
          <FieldError errors={[errors.message]} />
        </Field>

        {/* Honeypot: fora da tela e fora da ordem de tabulação. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Enviando…" : "Enviar mensagem"}
          </Button>

          {result ? (
            <p
              role="status"
              aria-live="polite"
              className={
                result.ok
                  ? "text-sm text-foreground"
                  : "text-sm text-destructive"
              }
            >
              {result.message}
            </p>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
