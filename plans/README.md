# Revisão de usabilidade

[Relatório original](001-revisao-usabilidade-2026-10-01.md)

Uma primeira implementação desta revisão foi revertida a pedido do usuário (código restaurado ao commit `bf9a131`). Em 06/10/2026 o usuário pediu a correção dos erros UX-01 a UX-08, sem as melhorias opcionais; o status abaixo é dessa segunda rodada, ainda não commitada.

| ID | Status | Observação |
|---|---|---|
| UX-01 | Mitigado | Sem provedor de e-mail: a página mostra aviso com os canais diretos e a action não confirma envio. Integrar em `app/(site)/contato/_lib/contact-delivery.ts`. |
| UX-02 | Corrigido | Confirmação consulta o pedido na Wix e desconta só o que foi para aquele checkout. Não testado contra a Wix real. |
| UX-03 | Corrigido | Login conclui a verificação de e-mail e explica aprovação pendente. Sem reenvio de código (contrato não confirmado). |
| UX-04 | Mitigado | Newsletter removida do rodapé até haver provedor. |
| UX-05 | Mitigado | Links sem destino removidos; voltam quando houver URL e conteúdo reais. |
| UX-06 | Corrigido | Botão de pausa, sem troca com foco de teclado ou mouse em cima, e movimento reduzido respeitado. Sem imagem de pôster: iOS não verificado. |
| UX-07 | Corrigido | |
| UX-08 | Corrigido | |
| OP-01 a OP-03 | Não feito | Fora do pedido. |
