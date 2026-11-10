# ⚖️ LexControl

Gestão de contratos, pagamentos, custos e clientes do escritório. React + Vite + Firebase Firestore, hospedado no GitHub Pages.

## Desenvolvimento
```bash
npm install
npm run dev      # servidor local
npm run build    # gera dist/
```

## Publicação
Settings → Pages → Source: **GitHub Actions**. Todo push na `main` publica automaticamente (`.github/workflows/deploy.yml`).

## Pontos de atenção
- Config do Firebase em `src/firebase.js`; documento principal em `workspaces/meu-escritorio/data/main`.
- Backups automáticos semanais: documentos `data/backup-AAAA-MM-DD` (mantém os 8 últimos). Config. → restaurar/baixar.
- Chave da IA (Anthropic): digitada em Config. → "Chave da IA"; fica só no localStorage de cada aparelho.
- ⚠️ `firestore.rules` ainda está aberto (`if true`). Restringir com Firebase Auth antes de usar com dados reais.
