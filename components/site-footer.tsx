import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacebookIcon, InstagramIcon, XIcon } from "@/components/icons/social-icons";
import { Seal } from "./seal";
import { Wordmark } from "./wordmark";

const INSTITUTIONAL_LINKS = [
  { label: "Sustentabilidade", href: "#" },
  { label: "Trabalhe conosco", href: "#" },
] as const;

const HELP_LINKS = [
  { label: "Central de ajuda", href: "#" },
  { label: "Trocas e devoluções", href: "#" },
  { label: "Política de privacidade", href: "#" },
  { label: "Termos de uso", href: "#" },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "X (Twitter)", href: "#", icon: XIcon },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Seal className="size-7" />
            <Wordmark className="h-5 w-auto text-foreground" />
          </Link>
          <p className="max-w-xs font-serif text-sm text-muted-foreground">
            Ficção sombria ilustrada, em pequenas tiragens de colecionador.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-6 text-sm">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Institucional
            </h3>
            <nav className="flex flex-col gap-3">
              {INSTITUTIONAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-6 text-sm">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Ajuda
            </h3>
            <nav className="flex flex-col gap-3">
              {HELP_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-6 text-sm">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Contato
            </h3>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <a
                href="mailto:pedidos@hocuspocus.com.br"
                className="font-mono transition-colors hover:text-foreground"
              >
                pedidos@hocuspocus.com.br
              </a>
              <Link href="/contato" className="transition-colors hover:text-foreground">
                Ver todos os canais
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Newsletter
            </h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Receba novidades e ofertas exclusivas.
              </p>
              <form className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Seu e-mail"
                  aria-label="Seu e-mail"
                  className="h-10"
                />
                <Button
                  type="submit"
                  className="h-10 shrink-0 bg-foreground text-background hover:bg-foreground/85"
                >
                  Inscrever
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Hocus Pocus. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Pix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
