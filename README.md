# ✈️ Fuga, SA — Guia de Setup Completo

**A ferramenta do grupo para planear a viagem épica de maio de 2026.**

Este guia leva-te do zero ao deploy. Mesmo que nunca tenhas feito nada disto antes, segue passo a passo e em ~20 minutos tens a app online.

---

## 📋 O que vais precisar

- Um computador com internet
- ~20 minutos de tempo
- Nenhuma experiência prévia necessária!

Vamos criar contas em 3 serviços (todos gratuitos):
1. **GitHub** — para guardar o código
2. **Supabase** — para a base de dados
3. **Vercel** — para colocar a app online

---

## 🔧 Passo 1: Instalar Node.js (se não tiveres)

O Node.js é necessário para correr o projeto no teu computador.

1. Vai a **https://nodejs.org**
2. Clica no botão verde que diz **"LTS"** (recomendado)
3. Faz download e instala (Next, Next, Next... Accept)
4. Para confirmar que funciona, abre o **Terminal** (Mac) ou **Command Prompt** (Windows) e escreve:
   ```
   node --version
   ```
   Deve aparecer algo como `v20.x.x` ou `v22.x.x`

---

## 👤 Passo 2: Criar conta no GitHub

1. Vai a **https://github.com**
2. Clica em **"Sign up"**
3. Segue os passos (email, password, username)
4. Confirma o email

---

## 🗄️ Passo 3: Criar projeto no Supabase

### 3.1 — Criar conta
1. Vai a **https://supabase.com**
2. Clica em **"Start your project"**
3. Faz login com a tua conta GitHub (é mais fácil!)

### 3.2 — Criar novo projeto
1. Clica no botão verde **"New project"**
2. Escolhe a organização (a tua default)
3. Preenche:
   - **Name**: `fuga-sa`
   - **Database Password**: escolhe uma password forte (guarda-a, mas não vais precisar muito)
   - **Region**: `West EU (Ireland)` (ou a mais perto de ti)
4. Clica **"Create new project"**
5. **Espera 1-2 minutos** até o projeto ficar pronto (vais ver um spinner)

### 3.3 — Configurar a base de dados
1. No menu da esquerda, clica em **"SQL Editor"** (ícone de código)
2. Clica em **"New query"** (canto superior direito)
3. Abre o ficheiro `supabase-setup.sql` que está na pasta do projeto
4. **Copia todo o conteúdo** do ficheiro
5. **Cola** no editor SQL do Supabase
6. Clica no botão azul **"Run"** (ou Ctrl/Cmd + Enter)
7. Deves ver: `Success. No rows returned` — está perfeito!

### 3.4 — Ativar Realtime
1. No menu da esquerda, clica em **"Database"**
2. Clica em **"Replication"** (no submenu)
3. Na secção **"supabase_realtime"**, confirma que a tabela `user_data` está ativada
   - Se não estiver, clica no toggle para a ativar

### 3.5 — Copiar as credenciais
1. No menu da esquerda, clica em **"Project Settings"** (ícone de engrenagem, em baixo)
2. Clica em **"API"** (no submenu)
3. Vais precisar de 2 valores — **copia-os para um notepad**:
   - **Project URL**: começa com `https://xxxxx.supabase.co`
   - **anon public** key: uma string longa que começa com `eyJ...`

> ⚠️ **IMPORTANTE**: Copia o `anon` key (a pública), NÃO a `service_role` key!

---

## 💻 Passo 4: Configurar o projeto localmente

### 4.1 — Descarregar o projeto
Se recebeste o projeto como ZIP:
1. Extrai o ZIP para uma pasta (ex: `Desktop/fuga-sa`)

### 4.2 — Configurar as variáveis de ambiente
1. Na pasta do projeto, encontra o ficheiro `.env.example`
2. **Cria uma cópia** e renomeia para `.env.local`
   - **Mac/Linux**: no Terminal, vai à pasta do projeto e escreve: `cp .env.example .env.local`
   - **Windows**: copia o ficheiro e renomeia
3. Abre `.env.local` num editor de texto (Notepad, VS Code, etc.)
4. Substitui os valores pelas tuas credenciais do Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...A_SUA_CHAVE_AQUI
   ```
5. **Guarda o ficheiro**

### 4.3 — Instalar dependências e testar
1. Abre o **Terminal** (Mac) ou **Command Prompt** (Windows)
2. Navega até à pasta do projeto:
   ```bash
   cd Desktop/fuga-sa
   ```
   (ajusta o caminho conforme onde colocaste a pasta)
3. Instala as dependências:
   ```bash
   npm install
   ```
   Espera que termine (~1-2 minutos, ignora warnings)
4. Inicia o servidor local:
   ```bash
   npm run dev
   ```
5. Abre o browser e vai a: **http://localhost:3000**
6. Deves ver a app! 🎉 Testa se funciona (seleciona um utilizador, cria um PIN, etc.)

Para parar o servidor: no Terminal, pressiona `Ctrl + C`.

---

## 🚀 Passo 5: Colocar no GitHub

### 5.1 — Instalar Git (se não tiveres)
- **Mac**: já vem instalado! Testa com `git --version` no Terminal
- **Windows**: descarrega de https://git-scm.com e instala

### 5.2 — Criar repositório no GitHub
1. Vai a **https://github.com/new**
2. **Repository name**: `fuga-sa`
3. **Visibility**: `Private` (é para amigos, não precisa ser público)
4. **NÃO** marques "Add a README file" (já temos um)
5. Clica **"Create repository"**

### 5.3 — Enviar o código
No Terminal, dentro da pasta do projeto, executa estes comandos **um a um**:

```bash
git init
git add .
git commit -m "Fuga, SA - primeira versão"
git branch -M main
git remote add origin https://github.com/SEU-USERNAME/fuga-sa.git
git push -u origin main
```

> ⚠️ Substitui `SEU-USERNAME` pelo teu username do GitHub!

Se pedir login, usa as tuas credenciais do GitHub.

---

## 🌐 Passo 6: Deploy no Vercel

### 6.1 — Criar conta no Vercel
1. Vai a **https://vercel.com**
2. Clica em **"Sign Up"**
3. Escolhe **"Continue with GitHub"** (mais fácil!)

### 6.2 — Importar o projeto
1. No dashboard do Vercel, clica em **"Add New..." → "Project"**
2. Na lista de repositórios GitHub, encontra `fuga-sa` e clica **"Import"**
3. Na página de configuração:
   - **Framework Preset**: deve auto-detectar `Next.js` ✅
   - **Root Directory**: deixa vazio ✅
   - Abre a secção **"Environment Variables"**
   - Adiciona as 2 variáveis:
     | Name | Value |
     |------|-------|
     | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` (a tua URL) |
     | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (a tua chave) |
4. Clica **"Deploy"**
5. **Espera 1-2 minutos** até o deploy terminar
6. O Vercel vai dar-te um URL tipo: `https://fuga-sa.vercel.app` 🎉

### 6.3 — Testar!
1. Abre o URL que o Vercel te deu
2. Testa a app: seleciona um utilizador, cria PIN, preenche etapas
3. Abre o URL noutro browser/dispositivo e vê os dados a aparecer em tempo real!

---

## 📱 Partilhar com os amigos

Agora é a parte fácil! Envia o URL aos teus amigos:

> "Pessoal, abram este link e preencham as vossas preferências para a viagem de maio! 🏝️"
> 
> **https://fuga-sa.vercel.app** (ou o URL que o Vercel te deu)

Cada amigo:
1. Abre o link no telemóvel ou computador
2. Seleciona o seu nome
3. Cria um PIN de 4 dígitos (para ninguém mexer nos dados dos outros)
4. Preenche as 6 etapas
5. O Dashboard atualiza automaticamente em tempo real!

---

## ❓ FAQ & Troubleshooting

### "A app mostra loading infinito"
- Verifica se copiaste bem o URL e chave do Supabase no `.env.local` (ou nas variáveis do Vercel)
- Vai ao dashboard do Supabase e confirma que o projeto está ativo

### "Os dados não aparecem para outros utilizadores"
- Confirma que o Realtime está ativado (Passo 3.4)
- No Supabase, vai a Database → Tables → user_data e confirma que tem dados

### "Esqueci o meu PIN!"
- No Supabase, vai a **Table Editor → user_data**
- Encontra o teu `user_id`
- Muda o campo `pin` para `null`
- Da próxima vez que entrares, podes criar um novo PIN

### "Quero resetar todos os dados"
- No Supabase SQL Editor, corre:
  ```sql
  UPDATE user_data SET data = '{}', pin = NULL;
  ```

### "Quero resetar só o meu"
- No Supabase SQL Editor, corre:
  ```sql
  UPDATE user_data SET data = '{}', pin = NULL WHERE user_id = 'nuno';
  ```
  (substitui `nuno` pelo teu user_id)

### "Quero um domínio custom"
- No Vercel, vai a Settings → Domains
- Podes adicionar um domínio teu (ex: `fuga.nuno.pt`)

---

## 🏗️ Estrutura do Projeto

```
fuga-sa/
├── package.json          ← Dependências
├── next.config.mjs       ← Config Next.js
├── tailwind.config.ts    ← Config Tailwind CSS
├── supabase-setup.sql    ← SQL para criar a base de dados
├── .env.example          ← Template das variáveis
├── .env.local            ← As TUAS variáveis (não vai para o GitHub)
├── src/
│   ├── app/
│   │   ├── layout.tsx    ← Layout base (título, metadata)
│   │   ├── page.tsx      ← Página principal
│   │   └── globals.css   ← Estilos globais
│   ├── components/
│   │   └── FugaApp.tsx   ← A app completa (UI + lógica)
│   └── lib/
│       ├── supabase.ts   ← Ligação à base de dados
│       ├── data.ts       ← Dados (utilizadores, destinos, quiz)
│       └── helpers.ts    ← Funções auxiliares
```

---

## 📄 Licença

Projeto privado para uso do grupo de amigos. Boa viagem! ✈️🎉
