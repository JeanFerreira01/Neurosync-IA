================================================================================
  NEUROSYNC AI — Sistema de Gestão de Clínica Neuropsicológica
================================================================================

STACK
-----
Backend  : Django 6.0.5 + DRF + JWT (simplejwt) + SQLite (dev)  →  porta 8000
Frontend : React + Vite + TypeScript + Zustand + React Query + Recharts  →  porta 5173
IA       : Groq API (llama-3.3-70b-versatile)
PDF      : reportlab (Python puro, sem deps de sistema)


COMO RODAR (Windows)
---------------------
1. Ativar o venv (PowerShell):
   .\venv\Scripts\Activate.ps1

2. Backend:
   cd backend
   $env:DJANGO_SETTINGS_MODULE="config.settings.development"
   python manage.py runserver

3. Frontend (novo terminal):
   cd frontend
   npm run dev

   Acesso: http://localhost:5173

Python do venv: C:\Users\Jean\Desktop\projetoclinica\venv\Scripts\python.exe


VARIÁVEIS DE AMBIENTE
---------------------
Arquivo: backend/.env  (não commitado — ver backend/.env.example)

  SECRET_KEY=<django-secret>
  GROQ_API_KEY=gsk_...          ← chave ativa (Groq/Llama)
  OPENAI_API_KEY=sk-...         ← quota esgotada, não usar
  DEBUG=True
  ALLOWED_HOSTS=localhost,127.0.0.1


ESTRUTURA DO PROJETO
--------------------
projetoclinica/
  backend/
    apps/
      accounts/     — Auth JWT, 5 roles (admin_master, clinic_admin,
                       neuropsychologist, receptionist, patient)
      appointments/ — Agendamentos
      core/         — Clinic, TimeStampedModel, AuditLog
      financial/    — Lançamentos financeiros (em desenvolvimento)
      inventory/    — Produtos (materiais de teste), StockMovement
      neurotests/   — NeurotestScale, NeurotestSession
      patients/     — Pacientes
      reports/      — Laudos + IA + PDF
    config/
      settings/
        base.py         — configurações base
        development.py  — CORS_ALLOW_ALL_ORIGINS=True
        production.py
    requirements/
      base.txt
      development.txt
      production.txt
    manage.py

  frontend/
    src/
      components/   — AppLayout, Button, Badge, Modal, Select, DarkSelect
      hooks/        — useInventory, useNeurotests, useReports, usePatients, ...
      pages/
        admin/        — Painel admin (criar usuários, RoleSelector)
        appointments/ — Agendamentos
        auth/         — Login + registro público
        dashboard/    — Dashboard principal
        financial/    — Módulo financeiro (em desenvolvimento)
        inventory/    — Estoque de materiais de teste
        neurotests/   — Catálogo de escalas + sessões
        patients/     — Gestão de pacientes
        reports/      — Laudos com IA, scores, gráficos, PDF
      services/     — Chamadas de API (axios)
      types/        — Tipos TypeScript centralizados (index.ts)
      routes/       — React Router (index.tsx)
    vite.config.ts
    tsconfig.json
    package.json


SPRINTS CONCLUÍDAS
------------------
Sprint 1-3  Base, Auth, Agendamentos, Painel Admin
Sprint 4    Laudos com IA (Groq), scores neuropsicológicos, gráficos Recharts,
            exportação PDF (reportlab), 18 testes configurados no ScoreConfig.ts
Sprint 5A   Estoque integrado com Laudos:
            - Dedução automática de 1 unidade por teste ao criar laudo
            - InventoryPage com agrupamento Categoria → Testes → Produtos
            - Todos os testes cadastrados aparecem no estoque (mesmo sem material)
            - Botão "+ Adicionar" em cada teste
            - Editar/deletar escalas direto do estoque
            - stock_info.product_id no backend (fix de movimentação)
            - Chips de filtro mostram categorias mesmo sem produtos vinculados


PRÓXIMAS SPRINTS
----------------
Sprint 5B   Módulo Financeiro:
            - Lançamentos de receitas e despesas
            - Categorias financeiras (consulta, material, salário, etc.)
            - Relatório de fluxo de caixa (período, gráfico de barras)
            - Exportação PDF/CSV

Sprint 6    Dashboard avançado:
            - Consultas por dia (gráfico de linha)
            - Receita mensal vs despesas
            - Pacientes ativos / novos no mês
            - Testes mais aplicados (ranking)

Sprint 7    WhatsApp + Telemedicina + Notificações:
            - Confirmação automática de consultas via WhatsApp
            - Módulo de videochamada (telemedicina)
            - Notificações em tempo real (Django Channels / WebSocket)


CONVENÇÕES DO CÓDIGO
--------------------
- Todos os dropdowns usam DarkSelect customizado (sem <select> nativo)
- Todos os inputs usam estilo inline com rgba (sem Tailwind vars — conflitam com RGB)
- Cores de categoria (intelligence, memory, attention, etc.) são constantes
  definidas tanto em InventoryPage.tsx quanto em NeurotestsPage.tsx —
  manter sincronizadas ao adicionar novas categorias
- test_name no Product deve ser EXATAMENTE igual a scale.abbreviation || scale.name
  (case-insensitive no backend via __iexact, mas manter consistente)
- stock_info.product_id retornado pela API de escalas aponta para o primeiro
  produto vinculado — usar este ID diretamente para movimentações (não buscar
  em cache local)


ARQUIVOS-CHAVE
--------------
backend/apps/reports/serializers.py     — _deduct_inventory() ao criar laudo
backend/apps/inventory/views.py         — StockMovementViewSet.create() atualiza qty
backend/apps/neurotests/serializers.py  — get_stock_info() retorna product_id
frontend/src/pages/inventory/InventoryPage.tsx
frontend/src/pages/neurotests/NeurotestsPage.tsx
frontend/src/pages/reports/ReportEditor.tsx
frontend/src/pages/reports/ScoreConfig.ts   — templates de 18 testes
frontend/src/hooks/useInventory.ts
frontend/src/hooks/useNeurotests.ts
frontend/src/types/index.ts


BANCO DE DADOS
--------------
SQLite em desenvolvimento: backend/db.sqlite3 (não commitado)
Para resetar: python manage.py flush  ou deletar db.sqlite3 e rodar migrate

Migrations pendentes: nenhuma (todas aplicadas)


TESTE DE GERAÇÃO DE PDF
-----------------------
PDF de exemplo gerado: C:\Users\Jean\Desktop\laudo_teste_lucas_tdah_qi.pdf
Paciente: Lucas (12 anos fictício), testes: WISC-V + Conners 3 + SNAP-IV + TMT

================================================================================
