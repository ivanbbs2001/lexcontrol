# ⚖️ LexControl

Sistema de gestão do escritório Juliana Savi Advocacia: contratos, pagamentos, custos, clientes, audiências, parcerias e documentos. React + Vite + Firebase Firestore, publicado no GitHub Pages.

## Desenvolvimento
```bash
npm install
npm run dev      # servidor local
npm run build    # gera dist/
```

## Publicação
Settings → Pages → Source: **GitHub Actions**. Todo push na `main` publica automaticamente (`.github/workflows/deploy.yml`). Após o deploy, atualize a página com Ctrl+F5.

## Acesso
- Login com os usuários `JULIANA` e `IVAN` (mapeados para os e-mails em `src/firebase.js`).
- `firestore.rules` libera leitura e escrita apenas para `juliana@lexcontrol.app` e `ivan@lexcontrol.app`. Qualquer outra conta é negada, mesmo autenticada.
- As duas contas precisam existir no Firebase Authentication (criadas manualmente no console).

## Abas
- **Início:** resumo geral e Mensagem do dia (resumos das 180 lições de *Pão Nosso*, em `src/mensagens.js`).
- **Contratos:** cadastro, cronograma de parcelas, filtros, ficha e geração de documentos Word (contrato, procuração e declaração de hipossuficiência) a partir dos modelos em `public/modelos/`.
- **Pagamentos:** visão em planilha por mês (vencimento, cliente, parceria, valor da parcela, parte da Juliana e data do pagamento), com:
  - seção **ATRASADOS** de meses anteriores;
  - baixa integral e pagamento parcial (a parcela é dividida em "parcial" e "saldo");
  - gerador automático de parcelas a partir de número, valor e 1º vencimento;
  - aviso de vencimento em até 7 dias (ícone na linha);
  - botão de cobrança pelo WhatsApp com texto padronizado (abre o `wa.me`; o envio é feito por você). Registra a data do último aviso.
  - gráfico de fluxo de entrada do ano.
- **Custos:** despesas mensais, com recorrência e marcação de pago.
- **Clientes:** cadastro com CEP (preenche rua, bairro e cidade pelo ViaCEP; número do imóvel é campo próprio), telefone no padrão (00) 00000-0000, ficha e fila semanal de contato. Excluir cliente remove seus contratos, pagamentos manuais e audiências, após aviso com a lista do que será apagado. Custos com o nome do cliente na descrição são apenas listados, não apagados.
- **Audiências:** calendário e exportação `.ics` com alertas 1 dia e 1 hora antes.
- **Parcerias:** cadastro de advogados parceiros, vinculados aos contratos.
- **Relatório:** fluxo de caixa por mês (entradas, saídas e saldo), com gráfico para os meses escolhidos e opção de impressão.
- **Config.:** exportar e importar backup (JSON), exportar listas de clientes e de pagamentos em CSV, chave da IA e tema (Escuro, Claro, Industrial).
- **Links Úteis:** atalhos para tribunais (TJ-PR, TRF-4, TRT-PR, STF, STJ, CNJ/PDPJ), INSS (Meu INSS, CNIS) e cálculo (CJF/SICOM), agrupados por categoria.

## Dados e backups
- Documento principal: `workspaces/meu-escritorio/data/main` no Firestore. Sincronização por documento inteiro, com atraso de 1,5 s após cada alteração.
- Backups automáticos semanais em `data/backup-AAAA-MM-DD`, mantendo os 8 últimos. Restauração e download em Config.
- Chave da IA (Anthropic): digitada em Config. → "Chave da IA". Fica só no `localStorage` de cada aparelho, nunca no Firestore.

## Pontos de atenção
- **Edição simultânea:** como tudo é salvo no mesmo documento, duas pessoas editando ao mesmo tempo (ex.: notebook e celular) podem sobrescrever uma à outra. A solução é salvar por registro. Ainda não implementada.
- Cronograma de parcelas: parcelas lançadas antes do campo de dia não têm dia de vencimento, então o aviso de 7 dias não aparece para elas até o dia ser preenchido.
- Custos não têm vínculo formal com clientes; a ligação é só pelo nome na descrição.
- Testes: não há suíte automatizada no repositório. As verificações feitas até aqui foram manuais, com Playwright e uma simulação do Firebase.
