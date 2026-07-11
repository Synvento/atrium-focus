import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ---- Design tokens ----
// bg:      #0B0F0E  (quase preto, ligeiro verde)
// surface: #141917
// card:    #F2F5EC  (off-white esverdeado, não creme)
// ink:     #0B0F0E
// muted:   #6B756D
// accent:  #C6FF3D  (lima)
// frozen:  #4B5A52

const STAGES = [
  "Ideia",
  "Inteligência de Mercado",
  "Estratégia de Produto",
  "Identidade e Experiência",
  "Comercialização",
  "QA Estratégico",
  "Validação de Mercado",
  "GO / NO GO",
  "Desenvolvimento",
  "QA Produção",
  "Lançamento",
  "Monitorização",
];

const STAGE_OBJECTIVES = {
  "Ideia": "Decidir se vale a pena explorar uma oportunidade.",
  "Inteligência de Mercado": "Interpretar a informação produzida pelos agentes.",
  "Estratégia de Produto": "Tomar decisões de posicionamento.",
  "Identidade e Experiência": "Garantir coerência da visão.",
  "Comercialização": "Decidir como o produto chegará ao mercado.",
  "QA Estratégico": "Atuar como Investment Committee.",
  "Validação de Mercado": "Interpretar a reação real do mercado.",
  "GO / NO GO": "Tomar decisão executiva.",
  "Desenvolvimento": "Supervisionar execução.",
  "QA Produção": "Assumir o papel de aprovação final.",
  "Lançamento": "Liderar a entrada no mercado.",
  "Monitorização": "Aprender e alocar capital.",
};

const DEFAULT_TASKS = {
  "Ideia": [
    "Registar a oportunidade identificada",
    "Formular a hipótese de negócio em 1 frase",
    "Definir o problema principal a resolver",
    "Identificar porque esta ideia pode existir agora",
    "Avaliar alinhamento com a visão da Atrium Factory",
    "Autorizar ou rejeitar entrada no pipeline",
  ],
  "Inteligência de Mercado": [
    "Rever relatórios e sínteses de mercado",
    "Identificar sinais fortes de oportunidade",
    "Validar se o problema é suficientemente relevante",
    "Comparar potencial entre oportunidades concorrentes",
    "Identificar riscos estratégicos",
    "Aprovar continuação da exploração",
  ],
  "Estratégia de Produto": [
    "Escolher segmento prioritário",
    "Aprovar proposta de valor",
    "Definir posicionamento estratégico",
    "Decidir modelo de monetização",
    "Definir objetivos de negócio",
    "Validar roadmap inicial",
  ],
  "Identidade e Experiência": [
    "Escolher direção de marca",
    "Aprovar naming e narrativa",
    "Validar experiência desejada",
    "Garantir alinhamento com o posicionamento",
    "Rever diferenciação percebida",
    "Aprovar identidade final",
  ],
  "Comercialização": [
    "Selecionar canais prioritários",
    "Definir estratégia de aquisição",
    "Aprovar pricing e ofertas",
    "Priorizar recursos comerciais",
    "Definir objetivos de lançamento",
    "Aprovar plano comercial",
  ],
  "QA Estratégico": [
    "Rever todos os outputs produzidos",
    "Questionar pressupostos críticos",
    "Identificar incoerências",
    "Avaliar risco vs retorno",
    "Confirmar alinhamento com o portfolio",
    "Decidir se avança para validação",
  ],
  "Validação de Mercado": [
    "Definir métricas de validação",
    "Rever resultados dos testes",
    "Identificar sinais de product-market fit",
    "Avaliar qualidade do feedback",
    "Decidir eventuais pivots",
    "Autorizar ou não investimento adicional",
  ],
  "GO / NO GO": [
    "Consolidar toda a informação",
    "Comparar risco e upside",
    "Avaliar recursos necessários",
    "Priorizar face aos restantes projetos",
    "Decidir GO, PIVOT ou NO GO",
    "Formalizar decisão",
  ],
  "Desenvolvimento": [
    "Definir prioridades de desenvolvimento",
    "Remover bloqueios estratégicos",
    "Rever milestones",
    "Garantir alinhamento entre equipas/agentes",
    "Aprovar alterações relevantes",
    "Decidir trade-offs",
  ],
  "QA Produção": [
    "Rever produto final",
    "Validar qualidade percebida",
    "Garantir coerência da experiência",
    "Verificar readiness para lançamento",
    "Aprovar correções críticas",
    "Autorizar release",
  ],
  "Lançamento": [
    "Aprovar data de lançamento",
    "Coordenar execução global",
    "Monitorizar indicadores iniciais",
    "Tomar decisões rápidas perante problemas",
    "Comunicar prioridades à organização",
    "Declarar lançamento concluído",
  ],
  "Monitorização": [
    "Rever KPIs periodicamente",
    "Identificar oportunidades de otimização",
    "Decidir novos investimentos",
    "Avaliar expansão ou escala",
    "Capturar aprendizagens para o AFOS",
    "Decidir manutenção, pivot ou encerramento",
  ],
};

const STAGES_AFOS = STAGES;

const STAGES_GENERIC = [
  "Ideia",
  "Definição",
  "Construção",
  "Lançamento",
  "Monitorização",
  "Velocidade Cruzeiro",
];

const GENERIC_OBJECTIVES = {
  "Ideia": "Registar e explorar a oportunidade.",
  "Definição": "Definir o que se vai construir e para quem.",
  "Construção": "Executar e construir o essencial.",
  "Lançamento": "Colocar no mercado.",
  "Monitorização": "Acompanhar resultados iniciais.",
  "Velocidade Cruzeiro": "Manter e otimizar em regime estável.",
};

const DEFAULT_TASKS_GENERIC = {
  "Ideia": ["Registar a oportunidade", "Definir o problema principal", "Avaliar se vale a pena avançar"],
  "Definição": ["Definir público-alvo", "Definir proposta de valor", "Definir âmbito mínimo"],
  "Construção": ["Construir versão inicial", "Testar fluxo principal", "Preparar para lançar"],
  "Lançamento": ["Publicar / disponibilizar", "Comunicar a quem interessa", "Recolher primeiras reações"],
  "Monitorização": ["Rever resultados iniciais", "Ajustar o que não está a funcionar"],
  "Velocidade Cruzeiro": ["Rever métricas periodicamente", "Otimizar o que já existe", "Decidir manter, escalar ou encerrar"],
};

function stagesFor(lifecycle) {
  return lifecycle === "generic" ? STAGES_GENERIC : STAGES_AFOS;
}

function objectivesFor(lifecycle) {
  return lifecycle === "generic" ? GENERIC_OBJECTIVES : STAGE_OBJECTIVES;
}

function defaultTasksFor(lifecycle) {
  return lifecycle === "generic" ? DEFAULT_TASKS_GENERIC : DEFAULT_TASKS;
}

function stageLabel(lifecycle, stage) {
  if (lifecycle === "generic") return stage;
  const idx = STAGES_AFOS.indexOf(stage);
  return idx >= 0 ? `${String(idx + 1).padStart(2, "0")} ${stage}` : stage;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const PROJECTS_SEED = [
  {
    id: "1", title: "AnalyzerX", tag: "real estate", energy: 62, lastTouch: "hoje", lastTouchDate: todayStr(), stage: "Desenvolvimento", lifecycle: "afos", status: "active",
    tasks: [
      { id: "t1", text: "Definir prioridades de desenvolvimento", done: true, stage: "Desenvolvimento" },
      { id: "t2", text: "Remover bloqueios estratégicos", done: false, stage: "Desenvolvimento" },
      { id: "t3", text: "Rever milestones", done: false, stage: "Desenvolvimento" },
      { id: "t4", text: "Garantir alinhamento entre equipas/agentes", done: false, stage: "Desenvolvimento" },
      { id: "t5", text: "Aprovar alterações relevantes", done: false, stage: "Desenvolvimento" },
      { id: "t6", text: "Decidir trade-offs", done: false, stage: "Desenvolvimento" },
    ],
    taskHistory: [
      { stage: "GO / NO GO", tasks: [{ id: "h1", text: "Decidir GO, PIVOT ou NO GO", done: true }, { id: "h2", text: "Formalizar decisão", done: true }] },
    ],
  },
  {
    id: "2", title: "FlipOS", tag: "real estate", energy: 28, lastTouch: "há 3 dias", lastTouchDate: null, stage: "Validação de Mercado", lifecycle: "afos", status: "active",
    tasks: [
      { id: "t7", text: "Definir métricas de validação", done: true, stage: "Validação de Mercado" },
      { id: "t8", text: "Rever resultados dos testes", done: false, stage: "Validação de Mercado" },
      { id: "t9", text: "Identificar sinais de product-market fit", done: false, stage: "Validação de Mercado" },
      { id: "t10", text: "Avaliar qualidade do feedback", done: false, stage: "Validação de Mercado" },
      { id: "t11", text: "Decidir eventuais pivots", done: false, stage: "Validação de Mercado" },
      { id: "t12", text: "Autorizar ou não investimento adicional", done: false, stage: "Validação de Mercado" },
    ],
    taskHistory: [
      { stage: "Comercialização", tasks: [{ id: "h3", text: "Escrever lead magnet HTML", done: true }] },
    ],
  },
  {
    id: "3", title: "FoodClarity", tag: "nutrition", energy: 10, lastTouch: "há 6 dias", lastTouchDate: null, stage: "Identidade e Experiência", lifecycle: "afos", status: "active",
    tasks: [
      { id: "t13", text: "Escolher direção de marca", done: true, stage: "Identidade e Experiência" },
      { id: "t14", text: "Aprovar naming e narrativa", done: false, stage: "Identidade e Experiência" },
      { id: "t15", text: "Validar experiência desejada", done: false, stage: "Identidade e Experiência" },
      { id: "t16", text: "Garantir alinhamento com o posicionamento", done: false, stage: "Identidade e Experiência" },
      { id: "t17", text: "Rever diferenciação percebida", done: false, stage: "Identidade e Experiência" },
      { id: "t18", text: "Aprovar identidade final", done: false, stage: "Identidade e Experiência" },
    ],
    taskHistory: [],
  },
];

const FROZEN_SEED = [
  { id: "4", title: "InfoScore v2", tag: "tech", stage: "Pausado", lifecycle: "afos", notes: [{ id: "n1", text: "Retomar depois do AnalyzerX estabilizar" }] },
  { id: "5", title: "Agente Mira", tag: "agents", stage: "Ideia", lifecycle: "afos", notes: [] },
  { id: "6", title: "Receitas Ninja Creami", tag: "nutrition", stage: "Ideia", lifecycle: "afos", notes: [{ id: "n2", text: "Cruzar com receitas sugar-free do FoodClarity" }] },
];

function EnergyRing({ value, size = 220 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#22281f" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#C6FF3D"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function nextTask(project) {
  return (project.tasks || []).find((t) => !t.done) || null;
}

function daysAgoLabel(dateStr) {
  if (!dateStr) return "ainda não";
  const diff = Math.round((new Date(todayStr()) - new Date(dateStr)) / 86400000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  return `há ${diff} dias`;
}

function rowToProject(r) {
  return {
    id: r.id,
    title: r.title,
    tag: r.tag,
    energy: r.energy,
    lastTouchDate: r.last_touch_date,
    lastTouch: daysAgoLabel(r.last_touch_date),
    stage: r.stage,
    lifecycle: r.lifecycle,
    tasks: r.tasks || [],
    taskHistory: r.task_history || [],
    status: "active",
  };
}

function rowToFrozen(r) {
  return {
    id: r.id,
    title: r.title,
    tag: r.tag,
    stage: r.stage,
    lifecycle: r.lifecycle,
    notes: r.notes || [],
    tasksBackup: r.tasks_backup || [],
    historyBackup: r.history_backup || [],
  };
}

async function saveProject(p, userId) {
  await supabase.from("projects").upsert({
    id: p.id,
    user_id: userId,
    title: p.title,
    tag: p.tag,
    energy: p.energy,
    last_touch_date: p.lastTouchDate,
    stage: p.stage,
    lifecycle: p.lifecycle,
    tasks: p.tasks,
    task_history: p.taskHistory,
  });
}

async function saveFrozen(f, userId) {
  await supabase.from("frozen_ideas").upsert({
    id: f.id,
    user_id: userId,
    title: f.title,
    tag: f.tag,
    stage: f.stage,
    lifecycle: f.lifecycle,
    notes: f.notes,
    tasks_backup: f.tasksBackup,
    history_backup: f.historyBackup,
  });
}

async function deleteProjectRow(id) {
  await supabase.from("projects").delete().eq("id", id);
}

async function deleteFrozenRow(id) {
  await supabase.from("frozen_ideas").delete().eq("id", id);
}

function FocusApp({ session }) {
  const userId = session.user.id;
  const [projects, setProjects] = useState([]);
  const [frozen, setFrozen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home | pool | frozen
  const [cardIndex, setCardIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [detail, setDetail] = useState(null); // { kind: 'project'|'frozen', id }
  const [newEntry, setNewEntry] = useState("");
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = React.useRef(null);
  const movedRef = React.useRef(false);

  useEffect(() => {
    (async () => {
      const [{ data: projRows, error: e1 }, { data: frozRows, error: e2 }] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("frozen_ideas").select("*").eq("user_id", userId).order("created_at"),
      ]);
      if (!e1 && projRows) setProjects(projRows.map(rowToProject));
      if (!e2 && frozRows) setFrozen(frozRows.map(rowToFrozen));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    projects.forEach((p) => saveProject(p, userId));
  }, [projects, loading]);

  useEffect(() => {
    if (loading) return;
    frozen.forEach((f) => saveFrozen(f, userId));
  }, [frozen, loading]);

  const active = useMemo(
    () => [...projects].sort((a, b) => b.energy - a.energy),
    [projects]
  );
  const current = active.length > 0 ? active[cardIndex % active.length] : null;

  function touchProject() {
    if (current.lastTouchDate === todayStr()) {
      setToast("Já registaste hoje. Volta amanhã.");
      setTimeout(() => setToast(null), 1800);
      return;
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.id === current.id
          ? { ...p, energy: Math.min(100, p.energy + 15), lastTouch: "hoje", lastTouchDate: todayStr() }
          : p
      )
    );
    setToast("Registado. +15 de energia.");
    setTimeout(() => setToast(null), 1800);
  }

  function nextCard() {
    setCardIndex((i) => (i + 1) % active.length);
  }

  function prevCard() {
    setCardIndex((i) => (i - 1 + active.length) % active.length);
  }

  function freezeProject(id) {
    const p = projects.find((p) => p.id === id);
    if (!p) return;
    setProjects((prev) => prev.filter((x) => x.id !== id));
    setFrozen((prev) => [{ id: p.id, title: p.title, tag: p.tag, stage: p.stage, lifecycle: p.lifecycle, notes: [], tasksBackup: p.tasks, historyBackup: p.taskHistory }, ...prev]);
    deleteProjectRow(id);
    setToast(`${p.title} foi para o Congelador.`);
    setTimeout(() => setToast(null), 1800);
  }

  function addIdea() {
    if (!newTitle.trim()) return;
    const id = crypto.randomUUID();
    setFrozen((prev) => [
      { id, title: newTitle.trim(), tag: newTag.trim() || "geral", stage: "Ideia", lifecycle: "afos", notes: [] },
      ...prev,
    ]);
    setNewTitle("");
    setNewTag("");
    setShowAdd(false);
    setView("frozen");
    setToast("Ideia guardada no Congelador.");
    setTimeout(() => setToast(null), 1800);
  }

  function reactivate(id) {
    if (projects.length >= 3) {
      setToast("Já tens 3 projetos acordados. Congela um primeiro.");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    const f = frozen.find((f) => f.id === id);
    setFrozen((prev) => prev.filter((x) => x.id !== id));
    setProjects((prev) => [
      ...prev,
      { id: f.id, title: f.title, tag: f.tag, energy: 20, lastTouch: "hoje", lastTouchDate: null, stage: f.stage || "Ideia", lifecycle: f.lifecycle || "afos", status: "active", tasks: f.tasksBackup || [], taskHistory: f.historyBackup || [] },
    ]);
    deleteFrozenRow(id);
    setToast(`${f.title} foi reativado.`);
    setTimeout(() => setToast(null), 1800);
  }

  function changeStage(projectId, newStage) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId || p.stage === newStage) return p;
        const carryHistory = (p.tasks || []).length > 0
          ? [...(p.taskHistory || []), { stage: p.stage, tasks: p.tasks }]
          : (p.taskHistory || []);
        const defaults = (defaultTasksFor(p.lifecycle)[newStage] || [])
          .map((text, i) => ({ id: `${Date.now()}-${i}`, text, done: false, stage: newStage }));
        return { ...p, stage: newStage, tasks: defaults, taskHistory: carryHistory };
      })
    );
    setToast(`Fase: ${newStage} · tarefas anteriores arquivadas`);
    setTimeout(() => setToast(null), 2000);
  }

  function setLifecycle(projectId, newLifecycle) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId || p.lifecycle === newLifecycle) return p;
        const carryHistory = (p.tasks || []).length > 0
          ? [...(p.taskHistory || []), { stage: p.stage, tasks: p.tasks }]
          : (p.taskHistory || []);
        const firstStage = stagesFor(newLifecycle)[0];
        const defaults = (defaultTasksFor(newLifecycle)[firstStage] || [])
          .map((text, i) => ({ id: `${Date.now()}-${i}`, text, done: false, stage: firstStage }));
        return { ...p, lifecycle: newLifecycle, stage: firstStage, tasks: defaults, taskHistory: carryHistory };
      })
    );
    setToast(`Lifecycle alterado para ${newLifecycle === "generic" ? "genérico" : "AFOS"}`);
    setTimeout(() => setToast(null), 2000);
  }

  function toggleTask(projectId, taskId) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : p
      )
    );
  }

  function addTask(projectId, text) {
    if (!text.trim()) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: [...(p.tasks || []), { id: Date.now().toString(), text: text.trim(), done: false, stage: p.stage }] }
          : p
      )
    );
    setNewEntry("");
  }

  function addNote(frozenId, text) {
    if (!text.trim()) return;
    setFrozen((prev) =>
      prev.map((f) =>
        f.id === frozenId
          ? { ...f, notes: [...(f.notes || []), { id: Date.now().toString(), text: text.trim() }] }
          : f
      )
    );
    setNewEntry("");
  }

  function onDragStart(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragStart.current = x;
    movedRef.current = false;
    setDragging(true);
  }

  function onDragMove(e) {
    if (dragStart.current === null) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = x - dragStart.current;
    if (Math.abs(delta) > 6) movedRef.current = true;
    setDragX(delta);
  }

  function onDragEnd() {
    if (dragStart.current === null) return;
    const threshold = 70;
    if (dragX > threshold) {
      prevCard();
    } else if (dragX < -threshold) {
      nextCard();
    }
    dragStart.current = null;
    setDragX(0);
    setDragging(false);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "#0B0F0E", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#6B756D" }}>
            Atrium Factory
          </p>
          <h1 className="display text-2xl font-bold" style={{ color: "#F2F5EC" }}>
            Bom dia, Mafalda
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "#141917", color: "#C6FF3D", border: "1px solid #22281f" }}
          >
            {projects.length}/3 acordados
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "#C6FF3D", color: "#0B0F0E" }}
            aria-label="Adicionar ideia"
          >
            +
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "#141917", color: "#6B756D", border: "1px solid #22281f" }}
            aria-label="Sair"
            title="Sair"
          >
            ⏻
          </button>
        </div>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(11,15,14,0.7)" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl p-6"
            style={{ background: "#F2F5EC" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="display text-xl font-bold mb-4" style={{ color: "#0B0F0E" }}>
              Nova ideia
            </h3>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título"
              className="w-full px-4 py-3 rounded-xl mb-3 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #d8ddd0", color: "#0B0F0E" }}
            />
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Categoria (ex: real estate, nutrition)"
              className="w-full px-4 py-3 rounded-xl mb-5 text-sm outline-none"
              style={{ background: "#fff", border: "1px solid #d8ddd0", color: "#0B0F0E" }}
            />
            <p className="text-xs mb-4" style={{ color: "#6B756D" }}>
              Vai direto para o Congelador — sem competir já por atenção.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-2xl font-medium text-sm"
                style={{ background: "transparent", color: "#6B756D", border: "1px solid #d8ddd0" }}
              >
                Cancelar
              </button>
              <button
                onClick={addIdea}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm"
                style={{ background: "#C6FF3D", color: "#0B0F0E" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {view === "home" && !loading && !current && (
          <div className="w-full max-w-sm text-center">
            <p className="display text-xl font-bold mb-2" style={{ color: "#F2F5EC" }}>
              Sem projetos acordados
            </p>
            <p className="text-sm mb-5" style={{ color: "#6B756D" }}>
              Adiciona uma ideia (+) ou reativa algo do Congelador.
            </p>
          </div>
        )}
        {view === "home" && loading && (
          <p className="text-sm" style={{ color: "#6B756D" }}>A carregar...</p>
        )}
        {view === "home" && current && (
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="relative flex items-center justify-center mb-6">
              <EnergyRing value={current.energy} />
              <div className="absolute flex flex-col items-center">
                <span className="display text-5xl font-bold" style={{ color: "#F2F5EC" }}>
                  {current.energy}
                </span>
                <span className="text-xs" style={{ color: "#6B756D" }}>
                  energia
                </span>
              </div>
            </div>

            <div
              className="w-full rounded-3xl p-6 mb-4 cursor-pointer select-none"
              style={{
                background: "#F2F5EC",
                transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
                transition: dragging ? "none" : "transform 0.3s ease",
                touchAction: "pan-y",
              }}
              onPointerDown={onDragStart}
              onPointerMove={dragging ? onDragMove : undefined}
              onPointerUp={onDragEnd}
              onPointerLeave={dragging ? onDragEnd : undefined}
              onClick={() => {
                if (!movedRef.current) setDetail({ kind: "project", id: current.id });
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-wide font-medium" style={{ color: "#6B756D" }}>
                  {current.tag} · em foco
                </p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={
                    current.lifecycle === "generic"
                      ? { background: "transparent", color: "#0B0F0E", border: "1px solid #0B0F0E" }
                      : { background: "#0B0F0E", color: "#C6FF3D" }
                  }
                >
                  {stageLabel(current.lifecycle, current.stage)}
                </span>
              </div>
              <h2 className="display text-3xl font-bold mb-1" style={{ color: "#0B0F0E" }}>
                {current.title}
              </h2>
              <p className="text-sm mb-3" style={{ color: "#6B756D" }}>
                Último toque: {current.lastTouch}
              </p>

              {(() => {
                const nt = nextTask(current);
                return nt ? (
                  <div
                    className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl"
                    style={{ background: "#fff", border: "1px solid #d8ddd0" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#C6FF3D" }} />
                    <p className="text-sm font-medium" style={{ color: "#0B0F0E" }}>
                      Próxima: {nt.text}
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 px-3 py-2 rounded-xl" style={{ background: "#fff", border: "1px solid #d8ddd0" }}>
                    <p className="text-sm" style={{ color: "#6B756D" }}>
                      {(current.tasks || []).length === 0 ? "Sem tarefas ainda — toca no card para adicionar" : "Todas as tarefas concluídas ✓"}
                    </p>
                  </div>
                );
              })()}

              {(() => {
                const touchedToday = current.lastTouchDate === todayStr();
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); touchProject(); }}
                    disabled={touchedToday}
                    className="w-full py-4 rounded-2xl font-semibold text-base mb-3 transition-transform active:scale-95 disabled:active:scale-100"
                    style={{
                      background: touchedToday ? "#dfe3d7" : "#C6FF3D",
                      color: touchedToday ? "#9aa197" : "#0B0F0E",
                      cursor: touchedToday ? "default" : "pointer",
                    }}
                  >
                    {touchedToday ? "Já registado hoje ✓" : "Toquei nisto hoje"}
                  </button>
                );
              })()}

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); freezeProject(current.id); }}
                  className="flex-1 py-3 rounded-2xl font-medium text-sm transition-transform active:scale-95"
                  style={{ background: "transparent", color: "#6B756D", border: "1px solid #d8ddd0" }}
                >
                  Congelar
                </button>
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e2e6da" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "#6B756D" }}>
                    Ponto do projeto
                  </p>
                  <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid #d8ddd0" }}>
                    {[
                      { id: "afos", label: "AFOS" },
                      { id: "generic", label: "Genérico" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setLifecycle(current.id, opt.id)}
                        className="text-[10px] px-2.5 py-1 font-semibold"
                        style={{
                          background: current.lifecycle === opt.id ? "#0B0F0E" : "transparent",
                          color: current.lifecycle === opt.id ? "#C6FF3D" : "#6B756D",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stagesFor(current.lifecycle).map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStage(current.id, s)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={{
                        background: current.stage === s ? "#0B0F0E" : "transparent",
                        color: current.stage === s ? "#C6FF3D" : "#6B756D",
                        border: "1px solid " + (current.stage === s ? "#0B0F0E" : "#d8ddd0"),
                      }}
                    >
                      {stageLabel(current.lifecycle, s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {active.length > 1 && (
              <div className="flex gap-1.5 mb-2">
                {active.map((p, i) => (
                  <span
                    key={p.id}
                    className="rounded-full transition-all"
                    style={{
                      width: i === cardIndex % active.length ? 16 : 6,
                      height: 6,
                      background: i === cardIndex % active.length ? "#C6FF3D" : "#22281f",
                    }}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-center" style={{ color: "#6B756D" }}>
              {active.length > 1 ? "Desliza o card para o lado ↔ · " : ""}A energia decai −1/dia sem toque
            </p>
          </div>
        )}

        {view === "pool" && (
          <div className="w-full max-w-sm space-y-3">
            <h2 className="display text-xl font-bold mb-2" style={{ color: "#F2F5EC" }}>
              Projetos acordados
            </h2>
            {active.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl p-4 cursor-pointer"
                style={{ background: "#141917", border: "1px solid #22281f" }}
                onClick={() => setDetail({ kind: "project", id: p.id })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs uppercase" style={{ color: "#6B756D" }}>{p.tag}</p>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={
                          p.lifecycle === "generic"
                            ? { background: "transparent", color: "#F2F5EC", border: "1px solid #F2F5EC" }
                            : { background: "#0B0F0E", color: "#C6FF3D" }
                        }
                      >
                        {stageLabel(p.lifecycle, p.stage)}
                      </span>
                    </div>
                    <p className="display font-bold" style={{ color: "#F2F5EC" }}>{p.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="display text-xl font-bold" style={{ color: "#C6FF3D" }}>{p.energy}</p>
                    <p className="text-[10px]" style={{ color: "#6B756D" }}>{p.lastTouch}</p>
                  </div>
                </div>
                {(() => {
                  const nt = nextTask(p);
                  return nt ? (
                    <p className="text-xs mt-2 pt-2" style={{ color: "#8A9188", borderTop: "1px solid #22281f" }}>
                      Próxima: {nt.text}
                    </p>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        )}

        {view === "frozen" && (
          <div className="w-full max-w-sm space-y-3">
            <h2 className="display text-xl font-bold mb-1" style={{ color: "#F2F5EC" }}>
              Congelador
            </h2>
            <p className="text-xs mb-3" style={{ color: "#6B756D" }}>
              Sem culpa. Reativa quando fizer sentido.
            </p>
            {frozen.length === 0 && (
              <p className="text-sm" style={{ color: "#6B756D" }}>Vazio por agora.</p>
            )}
            {frozen.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl p-4 flex items-center justify-between cursor-pointer"
                style={{ background: "#141917", border: "1px solid #22281f" }}
                onClick={() => setDetail({ kind: "frozen", id: f.id })}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs uppercase" style={{ color: "#6B756D" }}>{f.tag}</p>
                    {f.stage && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={
                          f.lifecycle === "generic"
                            ? { background: "transparent", color: "#F2F5EC", border: "1px solid #F2F5EC" }
                            : { background: "#0B0F0E", color: "#C6FF3D" }
                        }
                      >
                        {stageLabel(f.lifecycle, f.stage)}
                      </span>
                    )}
                  </div>
                  <p className="display font-bold" style={{ color: "#F2F5EC" }}>{f.title}</p>
                  {(f.notes || []).length > 0 && (
                    <p className="text-[11px] mt-0.5" style={{ color: "#8A9188" }}>
                      {f.notes.length} nota{f.notes.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); reactivate(f.id); }}
                  className="text-xs px-3 py-2 rounded-full font-medium"
                  style={{ background: "#C6FF3D", color: "#0B0F0E" }}
                >
                  Reativar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal: tasks for projects, notes for frozen */}
      {detail && (() => {
        const isProject = detail.kind === "project";
        const item = isProject
          ? projects.find((p) => p.id === detail.id)
          : frozen.find((f) => f.id === detail.id);
        if (!item) return null;
        const list = isProject ? item.tasks || [] : item.notes || [];
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(11,15,14,0.7)" }}
            onClick={() => { setDetail(null); setNewEntry(""); }}
          >
            <div
              className="w-full max-w-sm rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              style={{ background: "#F2F5EC" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-wide font-medium" style={{ color: "#6B756D" }}>
                  {item.tag}
                </p>
                {item.stage && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={
                      item.lifecycle === "generic"
                        ? { background: "transparent", color: "#0B0F0E", border: "1px solid #0B0F0E" }
                        : { background: "#0B0F0E", color: "#C6FF3D" }
                    }
                  >
                    {stageLabel(item.lifecycle, item.stage)}
                  </span>
                )}
              </div>
              <h3 className="display text-2xl font-bold mb-1" style={{ color: "#0B0F0E" }}>
                {item.title}
              </h3>
              {isProject && objectivesFor(item.lifecycle)[item.stage] && (
                <p className="text-xs italic mb-4" style={{ color: "#6B756D" }}>
                  {objectivesFor(item.lifecycle)[item.stage]}
                </p>
              )}

              <p className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "#6B756D" }}>
                {isProject ? "Tarefas, por ordem" : "Notas"}
              </p>

              {list.length === 0 && (
                <p className="text-sm mb-3" style={{ color: "#6B756D" }}>
                  {isProject ? "Ainda sem tarefas." : "Ainda sem notas."}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {isProject
                  ? list.map((t, i) => {
                      const isNext = !t.done && (item.tasks.find((x) => !x.done)?.id === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTask(item.id, t.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                          style={{
                            background: isNext ? "#fff" : "transparent",
                            border: "1px solid " + (isNext ? "#0B0F0E" : "#d8ddd0"),
                          }}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: t.done ? "#0B0F0E" : "transparent",
                              color: "#C6FF3D",
                              border: "1px solid " + (t.done ? "#0B0F0E" : "#9aa197"),
                            }}
                          >
                            {t.done ? "✓" : i + 1}
                          </span>
                          <span
                            className="text-sm flex-1"
                            style={{
                              color: t.done ? "#9aa197" : "#0B0F0E",
                              textDecoration: t.done ? "line-through" : "none",
                            }}
                          >
                            {t.text}
                          </span>
                          {isNext && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#C6FF3D", color: "#0B0F0E" }}>
                              próxima
                            </span>
                          )}
                        </button>
                      );
                    })
                  : list.map((n) => (
                      <div key={n.id} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "#fff", border: "1px solid #d8ddd0", color: "#0B0F0E" }}>
                        {n.text}
                      </div>
                    ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") isProject ? addTask(item.id, newEntry) : addNote(item.id, newEntry);
                  }}
                  placeholder={isProject ? "Nova tarefa..." : "Nova nota..."}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "#fff", border: "1px solid #d8ddd0", color: "#0B0F0E" }}
                />
                <button
                  onClick={() => (isProject ? addTask(item.id, newEntry) : addNote(item.id, newEntry))}
                  className="px-4 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: "#C6FF3D", color: "#0B0F0E" }}
                >
                  +
                </button>
              </div>

              {isProject && (item.taskHistory || []).length > 0 && (
                <div className="mt-5 pt-4" style={{ borderTop: "1px solid #d8ddd0" }}>
                  <p className="text-[10px] uppercase tracking-wide font-medium mb-3" style={{ color: "#6B756D" }}>
                    Histórico de fases anteriores
                  </p>
                  <div className="space-y-3">
                    {item.taskHistory.map((h, hi) => (
                      <div key={hi}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#8A9188" }}>
                          {h.stage}
                        </p>
                        <div className="space-y-1">
                          {h.tasks.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: t.done ? "#9aa197" : "#0B0F0E" }}>
                              <span>{t.done ? "✓" : "○"}</span>
                              <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium" style={{ background: "#F2F5EC", color: "#0B0F0E" }}>
          {toast}
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-around px-6 py-5" style={{ borderTop: "1px solid #141917" }}>
        {[
          { id: "home", label: "Foco" },
          { id: "pool", label: "Energia" },
          { id: "frozen", label: "Congelador" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: view === tab.id ? "#C6FF3D" : "#22281f" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: view === tab.id ? "#F2F5EC" : "#6B756D" }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6"
      style={{ background: "#0B0F0E", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6B756D" }}>
        Atrium Factory
      </p>
      <h1 className="display text-3xl font-bold mb-8" style={{ color: "#F2F5EC" }}>
        Focus
      </h1>

      {sent ? (
        <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: "#F2F5EC" }}>
          <p className="text-sm" style={{ color: "#0B0F0E" }}>
            Enviámos um link de acesso para <strong>{email}</strong>. Abre-o neste telemóvel para entrares.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink} className="w-full max-w-sm rounded-3xl p-6" style={{ background: "#F2F5EC" }}>
          <p className="text-sm mb-4" style={{ color: "#6B756D" }}>
            Entra com o teu email. Sem password — enviamos-te um link de acesso.
          </p>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teu@email.com"
            className="w-full px-4 py-3 rounded-xl mb-3 text-sm outline-none"
            style={{ background: "#fff", border: "1px solid #d8ddd0", color: "#0B0F0E" }}
          />
          {error && <p className="text-xs mb-3" style={{ color: "#b0453a" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ background: "#C6FF3D", color: "#0B0F0E" }}
          >
            {loading ? "A enviar..." : "Enviar link de acesso"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = a verificar, null = sem sessão

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#0B0F0E" }}>
        <p className="text-sm" style={{ color: "#6B756D" }}>A carregar...</p>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <FocusApp session={session} />;
}
