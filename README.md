# Atrium Focus

App pessoal de foco: energia por projeto, congelador de ideias, lifecycle AFOS/genérico.

## 1. Supabase
1. Cria projeto em supabase.com (ou usa o que já tens)
2. Se ainda não correste o schema base, corre `supabase_schema.sql`
3. Corre também `supabase_migration_ideas.sql` — cria a tabela `ideas` (Incubadora), aditiva, não apaga nada
4. Copia Project URL e anon key de Project Settings → API
5. Em **Authentication → URL Configuration**, define o "Site URL" como o teu domínio Vercel
6. O login é por email + password. Se já tinhas conta criada por magic link (sem password), usa "Esqueci-me da password" no ecrã de login para lhe definires uma — não crias conta nova com o mesmo email

## 2. Edge Function (Organizar conversa com IA)
Esta função corre no servidor do Supabase, nunca no browser — a tua chave da Anthropic fica segura.

Precisas do Supabase CLI instalado (`npm i -g supabase`):
```
supabase login
supabase link --project-ref <o-teu-project-ref>   # está no URL do projeto Supabase
supabase functions deploy organize-idea
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
O `SUPABASE_URL` e `SUPABASE_ANON_KEY` já ficam disponíveis automaticamente dentro da função — não precisas de os configurar.

Se não quiseres usar a função de IA já (ela é opcional), a Incubadora funciona na mesma com o formulário manual.

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
