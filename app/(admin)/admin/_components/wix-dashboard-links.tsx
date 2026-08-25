import { WIX_METASITE_ID } from "@/lib/wix/config";

const WIX_DASHBOARD_BASE = `https://manage.wix.com/dashboard/${WIX_METASITE_ID}`;

const WIX_DASHBOARD_LINKS = [
  {
    href: `${WIX_DASHBOARD_BASE}/ecom-platform/orders-list`,
    title: "Pedidos",
    description:
      "Ver, marcar como enviado, cancelar ou reembolsar pedidos direto no painel da Wix.",
  },
  {
    href: `${WIX_DASHBOARD_BASE}/analytics/overviews/sales`,
    title: "Vendas",
    description: "Receita, número de pedidos e outras métricas de venda.",
  },
] as const;

/** Só links estáticos pro dashboard nativo da Wix — pedidos e métricas já são
 * gerenciados lá (com ações que este site não replica: marcar como enviado,
 * reembolsar, etc). Requer login de conta Wix; o `AdminGate` do site apenas
 * evita mostrar os links pra quem não é admin do site, não substitui o login
 * da Wix, que é quem de fato protege o painel deles. */
export function WixDashboardLinks() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos e métricas de venda são gerenciados no painel da Wix.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {WIX_DASHBOARD_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium text-foreground">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
