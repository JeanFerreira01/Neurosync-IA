---
name: project-neurosync
description: "NeuroSync AI — Sprints 1-5A concluídas 27/05/2026. PRÓXIMA SESSÃO: iniciar Sprint 6 (Financeiro + Dashboard avançado)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 12c23b18-b63a-41eb-938d-8beac4e823f6
---

# NeuroSync AI — Estado do Projeto

## Stack
- **Backend**: Django 6.0.5 + DRF + JWT (simplejwt) + SQLite (dev) — porta 8000
- **Frontend**: React + Vite + TypeScript + Zustand + React Query + Recharts — porta 5173
- **IA**: Groq API (llama-3.3-70b-versatile) — chave configurada no backend/.env
- **PDF**: reportlab (puro Python, sem deps de sistema)

## Como rodar
```bash
# Backend (bash no diretório backend/)
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py runserver

# Frontend (diretório frontend/)
npm run dev
```
Python do venv: `C:\Users\Jean\Desktop\projetoclinica\venv\Scripts\python.exe`

## Sprints concluídas

### Sprint 1-3 — Base, Agendamentos, Admin
- Auth JWT com 5 roles (admin_master, clinic_admin, neuropsychologist, receptionist, patient)
- Pacientes, Agendamentos, Painel Admin (criar usuários com RoleSelector)
- Login com ilustração SVG neural animada + registro público (força role neuropsicólogo)
- Todos os dropdowns usam DarkSelect customizado (sem native select)
- Todos os inputs usam `inputBase` com rgba inline (sem Tailwind vars — conflitam com RGB)

### Sprint 4 — Laudos e IA ✅ (concluída em 26/05/2026)

#### Backend (apps/reports/)
- **models.py**: Report com `sections` (JSON), `selected_tests` (JSON), `test_scores` (JSON), `assessment_file`, `ReportVersion`
- **serializers.py**: auto-versionamento no update, `professional` com `required=False`
- **views.py** endpoints:
  - CRUD padrão
  - `POST /reports/{id}/sign/` — assina e bloqueia edição
  - `POST /reports/{id}/pdf/` — gera PDF com gráficos via reportlab
  - `POST /reports/{id}/ai-assist/` — IA por seção (Groq)
  - `POST /reports/{id}/analyze-scores/` — IA gera laudo COMPLETO com scores, preenche todas as seções
  - `POST /reports/{id}/upload-assessment/` — upload de arquivo de avaliação
- **Migrations**: 0003 aplicada (assessment_file, selected_tests, test_scores)

#### Frontend (src/pages/reports/)
- **ReportsPage.tsx**: lista de laudos, modal "Novo Laudo" com dropdown escuro + seleção de 30 testes em 6 categorias com checkboxes
- **ReportEditor.tsx**: 3 abas na sidebar:
  - "Seções" — editor de texto por seção
  - "Pontuações" — upload de arquivo + score inputs por teste + botão "Gerar Laudo Completo com IA"
  - "Gráficos" — BarChart horizontal Recharts com linhas de referência (70/90/110)
- **ScoreConfig.ts**: templates de scores para 18 testes (WISC-V, WAIS-IV, Conners 3, SNAP-IV, TMT, Stroop, BRIEF-2, NEUPSILIN, BDI-II, BAI, Vineland-3, Figura de Rey, WCST, RAVLT, Cubos de Corsi, M-CHAT, CARS-2, Raven)
- **services/reports.ts**: `analyzeScores`, `uploadAssessment` adicionados
- **hooks/useReports.ts**: `useAnalyzeScores` adicionado

#### Configurações importantes
- `GROQ_API_KEY` no `backend/.env` (chave ativa: gsk_Uhbv...)
- `OPENAI_API_KEY` também no .env mas com quota esgotada (não usar)
- `CORS_ALLOW_ALL_ORIGINS = True` em development.py (evita problema de porta no Vite)
- `backend/.env` está no `.gitignore` ✅
- `backend/.env.example` criado com todas as variáveis

## Sprints concluídas — Sprint 5A ✅ (27/05/2026)

### Estoque integrado com Laudos ✅
- `_deduct_inventory()` no `ReportSerializer.create()` — deduz 1 unidade por teste em `selected_tests`
- `InventoryPage`: agrupamento Categoria → Testes → Produtos, sempre visível (sem collapse por teste)
- Chips de filtro mostram categorias mesmo sem produtos (conta escalas, não produtos)
- `stock_info.product_id` no backend — frontend usa direto para movimentações (fix bug silencioso)
- Botão "+ Adicionar" em todos os testes, pré-preenche quantidade=1
- Deletar/editar escalas direto do estoque

### Repo GitHub ✅
- https://github.com/JeanFerreira01/Neurosync-IA.git
- Commit: Sprints 1-5A + .claude/memory + REQUIREMENTS.txt

## ⚡ PRÓXIMA SESSÃO — Sprint 6 (iniciar imediatamente)

### Sprint 6 — Financeiro + Dashboard avançado
**Módulo Financeiro** (`apps/financial/` já existe no backend):
- Lançamentos de receitas e despesas (modelo `Transaction` já tem migrations)
- Categorias: consulta, avaliação, material, salário, aluguel, outro
- Listagem com filtro por período, tipo e categoria
- Totais: receita, despesa, saldo do período
- Gráfico de barras mensal (Recharts) na página financeira
- Exportação básica

**Dashboard avançado** (`src/pages/dashboard/`):
- Consultas por dia da semana (gráfico de linha — Recharts já instalado)
- Receita mensal vs despesas (gráfico de barras)
- Cards: pacientes ativos, consultas do mês, laudos emitidos, saldo do caixa
- Testes mais aplicados (ranking top 5)

### Sprint 7 — WhatsApp + Telemedicina + Notificações
- Integração WhatsApp (confirmação automática de consultas)
- Módulo telemedicina (videochamada)
- Notificações em tempo real (Django Channels / WebSocket)

**Why:** Usuário pediu explicitamente para salvar em memória e iniciar Sprint 6 na próxima sessão.
**How to apply:** Ao iniciar nova sessão, subir os dois servidores e começar direto pelo módulo financeiro (backend `apps/financial/views.py` + frontend `src/pages/financial/FinancialPage.tsx`).

## Arquivos-chave
```
backend/
  apps/reports/models.py          — Report + ReportVersion + ReportTemplate
  apps/reports/views.py           — todos os endpoints incluindo analyze-scores
  apps/reports/serializers.py     — auto-versioning, professional optional
  apps/reports/urls.py            — DefaultRouter
  config/settings/base.py         — GROQ_API_KEY e OPENAI_API_KEY via decouple
  config/settings/development.py  — CORS_ALLOW_ALL_ORIGINS = True
  .env                            — chaves reais (não commitar)

frontend/
  src/pages/reports/ReportsPage.tsx   — lista + modal novo laudo com seleção de testes
  src/pages/reports/ReportEditor.tsx  — editor completo (3 abas: Seções/Pontuações/Gráficos)
  src/pages/reports/ScoreConfig.ts    — templates de scores por teste neuropsicológico
  src/services/reports.ts             — todos os endpoints
  src/hooks/useReports.ts             — todos os hooks
  src/types/index.ts                  — Report com selected_tests, test_scores, assessment_file
  src/routes/index.tsx                — /reports → ReportsPage ✅
```

## PDF de teste gerado
`C:\Users\Jean\Desktop\laudo_teste_lucas_tdah_qi.pdf`
Paciente fictício Lucas (12 anos), WISC-V + Conners 3 + SNAP-IV + TMT, com gráficos de barras.
Usar para testar upload de arquivo de avaliação no sistema.

**Why:** Manter contexto completo para continuar o desenvolvimento na próxima sessão sem perder o fio.
**How to apply:** Ao iniciar nova sessão, ler este arquivo para entender o estado atual e retomar de onde parou. Próxima sprint é a 5 (Financeiro + Estoque).
