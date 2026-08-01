// Supabase Edge Function: organize-idea
// Recebe uma conversa colada e devolve os campos estruturados de uma ideia.
// A chave da Anthropic API fica só aqui (variável de ambiente da função), nunca no frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `És um assistente responsável por transformar uma conversa extensa numa ficha simples de uma ideia de negócio, produto, funcionalidade ou projeto potencial.

A ideia ainda não é um projeto ativo. Está a ser guardada numa Incubadora para possível retoma futura.

Analisa apenas o conteúdo fornecido. Não inventes informação que não esteja presente ou que não possa ser inferida com segurança.

Extrai e organiza a informação nos seguintes campos:

1. "title" — Nome curto, claro e memorável para a ideia.
2. "category" — Uma ou duas categorias curtas que descrevam o tipo de ideia, por exemplo: AI SaaS, Automated Business Model, Produto Digital, Mini App, Serviço ou Conteúdo.
3. "summary" — Resumo entre 2 e 5 frases que explique claramente o que é a ideia.
4. "problem" — Problema principal que a ideia pretende resolver.
5. "differentiator" — O principal elemento diferenciador. Explica porque não é apenas mais uma ferramenta, serviço ou produto semelhante.
6. "target_audience" — Público principal para quem a ideia foi pensada.
7. "standby_reason" — Motivo pelo qual a ideia está ou deve ficar em standby. Só preencher quando essa informação estiver explícita ou fortemente implícita na conversa. Caso contrário, devolver uma string vazia.
8. "next_step" — Uma única próxima ação concreta, pequena e realista, para retomar a ideia no futuro. Pode ser inferida com prudência a partir da conversa.
9. "notes" — Informação relevante que não cabe nos campos anteriores, incluindo modelos de monetização, funcionalidades futuras, referências, limitações, riscos ou possibilidades de expansão.

Regras:
- escreve em português europeu;
- sê claro e conciso;
- não cries um plano de negócio completo;
- não transformes a ideia num projeto;
- não cries fases, tarefas ou roadmaps;
- não uses linguagem promocional exagerada;
- evita repetir a mesma informação em vários campos;
- quando não existir informação suficiente, usa uma string vazia;
- não devolvas comentários antes ou depois do JSON;
- devolve apenas JSON válido;
- todos os campos devem existir;
- todos os valores devem ser strings.

Formato obrigatório:
{"title":"","category":"","summary":"","problem":"","differentiator":"","target_audience":"","standby_reason":"","next_step":"","notes":""}`;

const REQUIRED_FIELDS = [
  "title", "category", "summary", "problem", "differentiator",
  "target_audience", "standby_reason", "next_step", "notes",
];
const MAX_FIELD_LEN = 2000;
const MAX_INPUT_LEN = 60000;

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    // Autenticação: confirma que quem chama é um utilizador válido do Supabase.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const content = (body?.content ?? "").toString();
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Conteúdo vazio." }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }
    const trimmedContent = content.slice(0, MAX_INPUT_LEN);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "IA não configurada no servidor." }), {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Conteúdo a analisar:\n\n${trimmedContent}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: "Falha ao contactar a IA.", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const rawText = (aiJson?.content ?? [])
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    // Parsing seguro: tira eventuais fences de código, tenta JSON.parse.
    const cleaned = rawText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "A IA devolveu um formato inválido. Tenta novamente." }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // Validação de schema: todos os campos têm de existir e ser strings, com limite de tamanho.
    const result: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS) {
      const v = parsed[field];
      result[field] = typeof v === "string" ? v.slice(0, MAX_FIELD_LEN) : "";
    }
    if (!result.title.trim() || !result.summary.trim()) {
      return new Response(JSON.stringify({ error: "A IA não conseguiu identificar título/resumo. Tenta com mais contexto." }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro inesperado.", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
