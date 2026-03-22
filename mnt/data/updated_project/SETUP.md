# Setup do Chatbot — Typebot + Vercel

## Arquivos do projeto
```
portfolio_thiago/
├── index.html
├── sites.html
├── api/
│   └── chat.js
├── vercel.json
└── SETUP.md
```

---

## 1. Publicar o Typebot

1. Abra seu bot no Typebot
2. Clique em **Share** ou **Publish**
3. Confirme o **public ID** do bot:
   - no seu caso: `thiagoatendimento-h5xhgjy`
4. Gere ou copie seu **API token** no Typebot

---

## 2. Subir no Vercel

1. Envie os arquivos para um repositório no GitHub
2. Importe o projeto no Vercel
3. Em **Environment Variables**, adicione:

| Nome | Valor |
|------|-------|
| `TYPEBOT_API_TOKEN` | seu token da API do Typebot |
| `TYPEBOT_PUBLIC_ID` | thiagoatendimento-h5xhgjy |

4. Clique em **Deploy**

---

## 3. Como funciona

O frontend envia para sua função `/api/chat`.

Ela faz proxy para:
- `POST https://typebot.io/api/v1/typebots/thiagoatendimento-h5xhgjy/startChat`
- `POST https://typebot.io/api/v1/sessions/<sessionId>/continueChat`

Assim seu token fica protegido no backend.

---

## 4. Teste

1. Abra `sites.html`
2. Abra o chat
3. A primeira abertura deve iniciar o `startChat`
4. As próximas mensagens devem usar o `continueChat`

Se não funcionar, confira no Vercel:
- se o `TYPEBOT_API_TOKEN` está correto
- se o `TYPEBOT_PUBLIC_ID` está correto
- se o bot está publicado


---

## 5. Rodar localmente

Abrir o arquivo `sites.html` direto no navegador com caminho `file:///` **não vai funcionar**, porque o chat depende da rota `/api/chat`.

Use assim:

```bash
npm i -g vercel
vercel login
vercel dev
```

Depois abra:

```
http://localhost:3000/sites.html
```

Se você abrir o HTML direto pela pasta, o frontend tenta usar `http://localhost:3000/api/chat`, então o `vercel dev` precisa estar rodando.

### Checklist local

- `TYPEBOT_API_TOKEN` configurado no ambiente local
- `TYPEBOT_PUBLIC_ID=thiagoatendimento-h5xhgjy`
- bot publicado no Typebot
- testar em `http://localhost:3000/sites.html`

### Exemplo de variáveis locais

Crie um arquivo `.env.local` na raiz do projeto:

```env
TYPEBOT_API_TOKEN=seu_token_aqui
TYPEBOT_PUBLIC_ID=thiagoatendimento-h5xhgjy
```
