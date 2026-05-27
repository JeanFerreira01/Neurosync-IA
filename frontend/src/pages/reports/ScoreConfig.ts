export interface ScoreField {
  key: string;
  label: string;
  type: "index" | "t_score" | "raw" | "percentile" | "text";
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface TestConfig {
  fullName: string;
  category: string;
  fields: ScoreField[];
}

export const SCORE_CONFIGS: Record<string, TestConfig> = {
  "WISC-V": {
    fullName: "Escala Wechsler de Inteligência para Crianças - 5ª Edição",
    category: "Inteligência",
    fields: [
      { key: "qi_total",  label: "QI Total",                        type: "index",   min: 40, max: 160 },
      { key: "icv",       label: "ICV - Compreensão Verbal",         type: "index",   min: 40, max: 160 },
      { key: "irf",       label: "IRF - Raciocínio Fluido",          type: "index",   min: 40, max: 160 },
      { key: "ive",       label: "IVE - Visual Espacial",            type: "index",   min: 40, max: 160 },
      { key: "imt",       label: "IMT - Memória de Trabalho",        type: "index",   min: 40, max: 160 },
      { key: "ivp",       label: "IVP - Velocidade de Processamento",type: "index",   min: 40, max: 160 },
    ],
  },
  "WAIS-IV": {
    fullName: "Escala Wechsler de Inteligência para Adultos - 4ª Edição",
    category: "Inteligência",
    fields: [
      { key: "qi_total",  label: "QI Total",                        type: "index",   min: 40, max: 160 },
      { key: "icv",       label: "ICV - Compreensão Verbal",         type: "index",   min: 40, max: 160 },
      { key: "irp",       label: "IRP - Raciocínio Perceptual",      type: "index",   min: 40, max: 160 },
      { key: "imt",       label: "IMT - Memória de Trabalho",        type: "index",   min: 40, max: 160 },
      { key: "ivp",       label: "IVP - Velocidade de Processamento",type: "index",   min: 40, max: 160 },
    ],
  },
  "WPPSI-IV": {
    fullName: "Escala Wechsler de Inteligência Pré-Escolar - 4ª Edição",
    category: "Inteligência",
    fields: [
      { key: "qi_total",  label: "QI Total",                        type: "index",   min: 40, max: 160 },
      { key: "icv",       label: "ICV - Compreensão Verbal",         type: "index",   min: 40, max: 160 },
      { key: "irv",       label: "IRV - Raciocínio Visual",          type: "index",   min: 40, max: 160 },
      { key: "imf",       label: "IMF - Memória de Trabalho",        type: "index",   min: 40, max: 160 },
      { key: "ivp",       label: "IVP - Velocidade de Processamento",type: "index",   min: 40, max: 160 },
    ],
  },
  "Matrizes Progressivas de Raven": {
    fullName: "Matrizes Progressivas de Raven",
    category: "Inteligência",
    fields: [
      { key: "escore_bruto",  label: "Escore Bruto",   type: "raw",        min: 0,  max: 60 },
      { key: "percentil",     label: "Percentil",       type: "percentile", min: 1,  max: 99 },
      { key: "classificacao", label: "Classificação",   type: "text",       placeholder: "Ex: Médio Superior" },
    ],
  },
  "NEUPSILIN": {
    fullName: "Instrumento de Avaliação Neuropsicológica Breve",
    category: "Memória e Aprendizagem",
    fields: [
      { key: "orientacao",          label: "Orientação (0-17)",             type: "raw", min: 0, max: 17 },
      { key: "atencao",             label: "Atenção (0-30)",                type: "raw", min: 0, max: 30 },
      { key: "percepcao",           label: "Percepção (0-6)",               type: "raw", min: 0, max: 6  },
      { key: "memoria",             label: "Memória (0-55)",                type: "raw", min: 0, max: 55 },
      { key: "habilidades_arit",    label: "Habilidades Aritméticas (0-10)",type: "raw", min: 0, max: 10 },
      { key: "linguagem",           label: "Linguagem (0-66)",              type: "raw", min: 0, max: 66 },
      { key: "praxias",             label: "Praxias (0-16)",                type: "raw", min: 0, max: 16 },
      { key: "funcoes_exec",        label: "Funções Executivas (0-22)",     type: "raw", min: 0, max: 22 },
    ],
  },
  "Figura Complexa de Rey": {
    fullName: "Figura Complexa de Rey",
    category: "Memória e Aprendizagem",
    fields: [
      { key: "copia",        label: "Cópia (0-36)",           type: "raw", min: 0, max: 36 },
      { key: "mem_imediata", label: "Memória Imediata (0-36)",type: "raw", min: 0, max: 36 },
      { key: "mem_tardia",   label: "Memória Tardia (0-36)",  type: "raw", min: 0, max: 36 },
      { key: "percentil",    label: "Percentil",              type: "percentile", min: 1, max: 99 },
    ],
  },
  "Cubos de Corsi": {
    fullName: "Cubos de Corsi — Memória Visuoespacial",
    category: "Memória e Aprendizagem",
    fields: [
      { key: "span_direto",  label: "Span Direto",   type: "raw", min: 0, max: 9 },
      { key: "span_inverso", label: "Span Inverso",  type: "raw", min: 0, max: 9 },
    ],
  },
  "RAVLT": {
    fullName: "Rey Auditory Verbal Learning Test",
    category: "Memória e Aprendizagem",
    fields: [
      { key: "aprendizagem", label: "Total Aprendizagem (A1-A5)",  type: "raw",        min: 0, max: 75 },
      { key: "interferencia", label: "Lista B",                    type: "raw",        min: 0, max: 15 },
      { key: "rec_imediata", label: "Recordação Imediata (A6)",    type: "raw",        min: 0, max: 15 },
      { key: "rec_tardia",   label: "Recordação Tardia (A7)",      type: "raw",        min: 0, max: 15 },
      { key: "percentil",    label: "Percentil",                   type: "percentile", min: 1, max: 99 },
    ],
  },
  "Trail Making Test (TMT)": {
    fullName: "Trail Making Test — Partes A e B",
    category: "Atenção e Funções Executivas",
    fields: [
      { key: "parte_a_tempo",   label: "Parte A — Tempo (s)",   type: "raw", min: 0, max: 300 },
      { key: "parte_a_erros",   label: "Parte A — Erros",       type: "raw", min: 0, max: 20  },
      { key: "parte_b_tempo",   label: "Parte B — Tempo (s)",   type: "raw", min: 0, max: 300 },
      { key: "parte_b_erros",   label: "Parte B — Erros",       type: "raw", min: 0, max: 20  },
      { key: "b_menos_a",       label: "B - A (diferença)",     type: "raw", min: 0, max: 300 },
    ],
  },
  "Stroop Color-Word": {
    fullName: "Stroop Color and Word Test",
    category: "Atenção e Funções Executivas",
    fields: [
      { key: "palavra_escore",  label: "Palavra — Escore T",       type: "t_score", min: 20, max: 80 },
      { key: "cor_escore",      label: "Cor — Escore T",           type: "t_score", min: 20, max: 80 },
      { key: "cor_palavra",     label: "Cor-Palavra — Escore T",   type: "t_score", min: 20, max: 80 },
      { key: "interferencia",   label: "Índice de Interferência T", type: "t_score", min: 20, max: 80 },
    ],
  },
  "WCST": {
    fullName: "Wisconsin Card Sorting Test",
    category: "Atenção e Funções Executivas",
    fields: [
      { key: "categorias",       label: "Categorias Completadas",     type: "raw",        min: 0, max: 6  },
      { key: "erros_perseverativos", label: "Erros Perseverativos",   type: "raw",        min: 0, max: 128 },
      { key: "percentil",        label: "Percentil Geral",            type: "percentile", min: 1, max: 99 },
    ],
  },
  "BRIEF-2": {
    fullName: "Behavior Rating Inventory of Executive Function - 2ª Edição",
    category: "Atenção e Funções Executivas",
    fields: [
      { key: "irco",  label: "IRCO - Regulação Comportamental (T)",type: "t_score", min: 20, max: 100 },
      { key: "iremo", label: "IREMO - Regulação Emocional (T)",    type: "t_score", min: 20, max: 100 },
      { key: "icog",  label: "ICog - Índice Cognitivo (T)",         type: "t_score", min: 20, max: 100 },
      { key: "igfe",  label: "IGFE - Índice Global FE (T)",         type: "t_score", min: 20, max: 100 },
    ],
  },
  "Conners 3": {
    fullName: "Escala de Conners - 3ª Edição",
    category: "Desenvolvimento e TDAH",
    fields: [
      { key: "tdah_total",    label: "TDAH Total (T)",                   type: "t_score", min: 20, max: 100 },
      { key: "desatencao",    label: "Desatenção (T)",                   type: "t_score", min: 20, max: 100 },
      { key: "hiperatividade",label: "Hiperatividade/Impulsividade (T)", type: "t_score", min: 20, max: 100 },
      { key: "prob_aprendiz", label: "Problemas de Aprendizagem (T)",    type: "t_score", min: 20, max: 100 },
      { key: "func_exec",     label: "Funcionamento Executivo (T)",       type: "t_score", min: 20, max: 100 },
    ],
  },
  "SNAP-IV": {
    fullName: "Swanson, Nolan and Pelham - IV",
    category: "Desenvolvimento e TDAH",
    fields: [
      { key: "desatencao",    label: "Desatenção (média 0-3)",            type: "raw", min: 0, max: 3 },
      { key: "hiperatividade",label: "Hiperatividade/Impulsividade (0-3)",type: "raw", min: 0, max: 3 },
      { key: "oposicao",      label: "Oposição Desafiante (0-3)",         type: "raw", min: 0, max: 3 },
    ],
  },
  "Vineland-3": {
    fullName: "Vineland Adaptive Behavior Scales - 3ª Edição",
    category: "TEA e Neurodesenvolvimento",
    fields: [
      { key: "comunicacao",    label: "Comunicação (Escore Padrão)",        type: "index", min: 20, max: 160 },
      { key: "vida_diaria",    label: "Vida Diária (Escore Padrão)",        type: "index", min: 20, max: 160 },
      { key: "socializacao",   label: "Socialização (Escore Padrão)",       type: "index", min: 20, max: 160 },
      { key: "motor",          label: "Motor (Escore Padrão)",              type: "index", min: 20, max: 160 },
      { key: "geral",          label: "Comportamento Adaptativo Geral",     type: "index", min: 20, max: 160 },
    ],
  },
  "M-CHAT-R/F": {
    fullName: "Modified Checklist for Autism in Toddlers - Revisado",
    category: "TEA e Neurodesenvolvimento",
    fields: [
      { key: "escore_total",  label: "Escore Total (0-20)",   type: "raw",  min: 0,  max: 20 },
      { key: "resultado",     label: "Resultado",             type: "text", placeholder: "Baixo / Médio / Alto Risco" },
    ],
  },
  "CARS-2": {
    fullName: "Childhood Autism Rating Scale - 2ª Edição",
    category: "TEA e Neurodesenvolvimento",
    fields: [
      { key: "escore_total",  label: "Escore Total (15-60)",  type: "raw",  min: 15, max: 60 },
      { key: "classificacao", label: "Classificação",         type: "text", placeholder: "Sem TEA / TEA Leve-Moderado / TEA Grave" },
    ],
  },
  "BDI-II": {
    fullName: "Inventário de Depressão de Beck - 2ª Edição",
    category: "Personalidade e Emoção",
    fields: [
      { key: "escore_total",  label: "Escore Total (0-63)",   type: "raw",  min: 0, max: 63 },
      { key: "classificacao", label: "Classificação",         type: "text", placeholder: "Mínima / Leve / Moderada / Grave" },
    ],
  },
  "BAI": {
    fullName: "Inventário de Ansiedade de Beck",
    category: "Personalidade e Emoção",
    fields: [
      { key: "escore_total",  label: "Escore Total (0-63)",   type: "raw",  min: 0, max: 63 },
      { key: "classificacao", label: "Classificação",         type: "text", placeholder: "Mínima / Leve / Moderada / Grave" },
    ],
  },
};

export function classifyIndexScore(score: number): string {
  if (score >= 130) return "Muito Superior";
  if (score >= 120) return "Superior";
  if (score >= 110) return "Médio Superior";
  if (score >= 90)  return "Médio";
  if (score >= 80)  return "Médio Inferior";
  if (score >= 70)  return "Limítrofe";
  return "Extremamente Baixo";
}

export function classifyTScore(score: number): string {
  if (score >= 70) return "Muito Elevado";
  if (score >= 65) return "Elevado";
  if (score >= 60) return "Levemente Elevado";
  return "Dentro da Média";
}

export function getIndexColor(score: number): string {
  if (score >= 110) return "rgba(80,210,130,0.9)";
  if (score >= 90)  return "rgba(130,180,255,0.9)";
  if (score >= 80)  return "rgba(250,200,60,0.9)";
  return "rgba(255,100,100,0.9)";
}
