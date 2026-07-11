# Atrium Focus

App pessoal de foco: energia por projeto, congelador de ideias, lifecycle AFOS/genérico.

## 1. Supabase
1. Cria projeto em supabase.com
2. Corre `supabase_schema.sql` (na raiz do zip, um nível acima) no SQL Editor
3. Copia Project URL e anon key de Project Settings → API
4. Em **Authentication → URL Configuration**, define o "Site URL" como o teu domínio Vercel (depois de fazeres o deploy) — sem isto o link de login pode redirecionar mal
5. Por defeito o login é por "magic link" (email, sem password). Não precisas de configurar mais nada — o Supabase já envia o email automaticamente

## 2. Configurar localmente
```
npm install
cp .env.example .env
# edita .env com os teus valores do Supabase
npm run dev
```
Abre localhost:5173 para testar.

## 3. Deploy no Vercel
Opção A — via site (mais simples, sem terminal):
1. Sobe esta pasta para um repositório novo no GitHub (github.com → New repository → arrasta os ficheiros, ou usa GitHub Desktop)
2. Em vercel.com → Add New → Project → importa o repositório
3. Em Environment Variables, adiciona:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

Opção B — via terminal, se preferires:
```
npm i -g vercel
vercel
# segue as perguntas, depois:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## 4. Instalar no telemóvel
1. Abre o URL do Vercel no Safari (iPhone) ou Chrome (Android)
2. iPhone: botão Partilhar → "Adicionar ao Ecrã Principal"
3. Android: menu (⋮) → "Adicionar ao ecrã principal" / "Instalar app"

Fica com ícone próprio, abre em ecrã inteiro, sem barra de navegador.
