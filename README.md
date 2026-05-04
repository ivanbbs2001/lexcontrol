# ⚖️ LexControl — Gestão de Escritório de Advocacia

Sistema completo de gestão de contratos, acompanhamento de pagamentos e controle de custos operacionais, com sincronização em tempo real via Firebase Firestore.

---

## ✨ Funcionalidades

- **Contratos** — Upload de PDF/Word com extração automática via IA (Claude API), controle de status, divisão de honorários entre advogados e cronograma de parcelas.
- **Pagamentos** — Visão mensal de recebimentos, progresso de arrecadação e divisão proporcional por advogado.
- **Custos Operacionais** — Registro de despesas por categoria, lançamentos recorrentes, controle de pagamento.
- **3 Temas** — Escuro, Claro e Industrial.
- **Sincronização em tempo real** — todos os dispositivos do escritório veem os mesmos dados via Firebase.

---

## 🚀 Como instalar e executar

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/lexcontrol.git
cd lexcontrol
npm install
```

### 2. Configure o Firebase

#### a) Crie um projeto no Firebase
1. Acesse https://console.firebase.google.com
2. Clique em **"Adicionar projeto"** → dê um nome (ex: `lexcontrol-escritorio`)
3. Desative o Google Analytics se não quiser (opcional)

#### b) Ative o Firestore
1. No menu lateral: **Build → Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de teste"** (depois você ajusta as regras)
4. Selecione a região `southamerica-east1` (São Paulo)

#### c) Registre o app Web
1. Na página inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido (ex: `lexcontrol-web`)
3. **Copie as credenciais** que aparecem no `firebaseConfig`

#### d) Configure as regras do Firestore
1. No Firebase Console → **Firestore → Regras**
2. Cole o conteúdo do arquivo `firestore.rules` deste projeto
3. Clique em **Publicar**

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
VITE_FIREBASE_API_KEY=AIzaSy...          # do firebaseConfig
VITE_FIREBASE_AUTH_DOMAIN=meu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=meu-projeto
VITE_FIREBASE_STORAGE_BUCKET=meu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_WORKSPACE_ID=nome-do-escritorio     # qualquer string única — todos os PCs com o mesmo ID compartilham dados

VITE_ANTHROPIC_API_KEY=sk-ant-...        # sua chave da API Anthropic para análise de contratos
```

> ⚠️ **Nunca faça commit do arquivo `.env`** — ele já está no `.gitignore`.

### 4. Execute localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 🌐 Deploy no GitHub Pages (ou Vercel/Netlify)

### Opção A — Vercel (recomendado, gratuito)

1. Faça push do projeto para o GitHub
2. Acesse https://vercel.com e importe o repositório
3. Em **Environment Variables**, adicione todas as variáveis do `.env`
4. Clique em **Deploy**

### Opção B — Netlify

1. Faça push para o GitHub
2. Acesse https://netlify.com → **Add new site → Import from Git**
3. Build command: `npm run build`  |  Publish directory: `dist`
4. Em **Environment Variables**, adicione as variáveis do `.env`
5. Deploy

### Opção C — GitHub Pages (requer ajuste no vite.config.js)

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: "/lexcontrol/",  // nome do seu repositório
});
```

```bash
npm run build
# Faça o deploy da pasta dist/ para a branch gh-pages
```

---

## 🗂️ Estrutura do Firestore

```
workspaces/
  {WORKSPACE_ID}/
    data/
      contracts  → { items: [...] }   # todos os contratos
      costs      → { items: [...] }   # custos operacionais
      theme      → { value: "dark" }  # preferência de tema
```

---

## 🔒 Segurança em produção

Quando o escritório estiver em produção, atualize as regras do Firestore para exigir autenticação:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/data/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

E ative no Firebase: **Authentication → Sign-in method → E-mail/Senha**.

---

## 🛠️ Stack

| Tecnologia | Uso |
|---|---|
| React 18 + Vite | Interface |
| Firebase Firestore | Banco de dados em tempo real |
| Claude API (Anthropic) | Extração de dados dos contratos |
| mammoth.js | Leitura de arquivos Word (.docx) |

---

## 📄 Licença

Uso interno — Escritório de Advocacia.
