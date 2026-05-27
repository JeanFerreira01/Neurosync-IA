from django.core.management.base import BaseCommand
from django.db import transaction

CATALOG = [
    # (test_key, full_name, category, age_range, app_time, description)
    # ── Inteligência e Cognição ──────────────────────────────────────────
    ("WISC-V",
     "Escala de Inteligência Wechsler para Crianças — 5ª Edição",
     "intelligence", "6–16 anos", "60–90 min",
     "Avalia inteligência e capacidade cognitiva em crianças e adolescentes. Composto por subtestes de compreensão verbal, visuoespacial, raciocínio fluido, memória de trabalho e velocidade de processamento."),

    ("WAIS-IV",
     "Escala de Inteligência Wechsler para Adultos — 4ª Edição",
     "intelligence", "16–90 anos", "60–90 min",
     "Principal instrumento para avaliação intelectual em adultos. Fornece QI Total e índices de compreensão verbal, perceptual, memória de trabalho e velocidade de processamento."),

    ("WPPSI-IV",
     "Escala de Inteligência Wechsler para Pré-Escolar e Primário — 4ª Edição",
     "intelligence", "2:6–7:7 anos", "30–60 min",
     "Avalia capacidade cognitiva em crianças pequenas. Adaptada para faixa pré-escolar com subtestes adequados ao desenvolvimento."),

    ("Matrizes Progressivas de Raven",
     "Matrizes Progressivas de Raven",
     "intelligence", "5+ anos", "15–45 min",
     "Teste não-verbal de inteligência fluida e raciocínio abstrato. Disponível em versões Coloridas (CPM), Standard (SPM) e Avançadas (APM)."),

    ("TIG-NV",
     "Teste de Inteligência Geral Não-Verbal",
     "intelligence", "7–17 anos", "25–35 min",
     "Instrumento brasileiro não-verbal para avaliação da inteligência geral. Não requer leitura ou escrita, sendo indicado para populações com dificuldades de linguagem."),

    # ── Memória e Aprendizagem ───────────────────────────────────────────
    ("NEUPSILIN",
     "Instrumento de Avaliação Neuropsicológica Breve — NEUPSILIN",
     "memory", "19–80 anos", "45–60 min",
     "Bateria breve de triagem neuropsicológica. Avalia orientação, atenção, percepção, memória, habilidades aritméticas, linguagem e funções executivas."),

    ("Figura Complexa de Rey",
     "Figura Complexa de Rey — FCR",
     "memory", "4+ anos", "20–30 min",
     "Avalia organização perceptual, memória visual e planejamento. Aplicado nas modalidades cópia e reprodução de memória imediata e tardia."),

    ("Cubos de Corsi",
     "Cubos de Corsi — Memória Visuoespacial",
     "memory", "6+ anos", "10–15 min",
     "Avalia memória de trabalho visuoespacial (alça fonológica visuoespacial). Mede span de memória direta e inversa via sequenciamento de cubos."),

    ("RAVLT",
     "Rey Auditory Verbal Learning Test — RAVLT",
     "memory", "7–89 anos", "15–20 min",
     "Avalia aprendizagem verbal, memória imediata, curva de aprendizagem, interferência e memória de longo prazo. Amplamente utilizado em avaliação neuropsicológica."),

    ("Memória de Trabalho (WAIS)",
     "Subtestes de Memória de Trabalho — WAIS-IV",
     "memory", "16–90 anos", "20–30 min",
     "Índice de Memória de Trabalho do WAIS-IV. Inclui subtestes de Sequência de Dígitos e Sequenciamento Letra-Número, avaliando a capacidade de reter e manipular informações."),

    # ── Atenção e Funções Executivas ─────────────────────────────────────
    ("Trail Making Test (TMT)",
     "Trail Making Test — Partes A e B",
     "attention", "7+ anos", "10–15 min",
     "Avalia atenção, velocidade de processamento e funções executivas (flexibilidade cognitiva). Parte A: sequência numérica. Parte B: alternância número-letra."),

    ("Stroop Color-Word",
     "Stroop Color-Word Test",
     "attention", "7+ anos", "5–10 min",
     "Avalia controle inibitório, velocidade de processamento e flexibilidade cognitiva. Mede o efeito de interferência Stroop entre leitura de palavras e nomeação de cores."),

    ("WCST",
     "Wisconsin Card Sorting Test",
     "attention", "6:6–89 anos", "20–30 min",
     "Avalia funções executivas, especialmente flexibilidade cognitiva, resolução de problemas e formação de conceitos. Sensível a lesões no córtex pré-frontal."),

    ("CPT-3",
     "Continuous Performance Test — 3ª Edição",
     "attention", "8+ anos", "14 min",
     "Avalia atenção sustentada, impulsividade e vigilância. Instrumento computadorizado que detecta padrões relacionados a TDAH e outros transtornos de atenção."),

    ("BRIEF-2",
     "Behavior Rating Inventory of Executive Function — 2ª Edição",
     "attention", "5–18 anos", "10–15 min",
     "Inventário de funções executivas respondido por pais e professores. Avalia inibição, flexibilidade, controle emocional, iniciativa, memória de trabalho, planejamento e monitoramento."),

    # ── Desenvolvimento / TDAH ───────────────────────────────────────────
    ("Conners 3",
     "Conners 3ª Edição — Avaliação de TDAH",
     "development", "6–18 anos", "20–30 min",
     "Escala amplamente utilizada para avaliação de TDAH em crianças e adolescentes. Versões para pais, professores e auto-relato. Avalia desatenção, hiperatividade/impulsividade e problemas associados."),

    ("SNAP-IV",
     "Swanson, Nolan and Pelham — Escala IV",
     "development", "6–18 anos", "10 min",
     "Escala de rastreio para TDAH baseada nos critérios do DSM. Versões para pais e professores. Amplamente utilizada em pesquisa e contexto clínico."),

    ("CBCL",
     "Child Behavior Checklist — Sistema Achenbach (ASEBA)",
     "development", "6–18 anos", "15–20 min",
     "Inventário de problemas de comportamento respondido pelos pais. Avalia competências sociais e problemas emocionais/comportamentais internalizantes e externalizantes."),

    ("SDQ",
     "Strengths and Difficulties Questionnaire — SDQ",
     "development", "4–17 anos", "5–10 min",
     "Questionário breve de rastreio de saúde mental infantil. Avalia sintomas emocionais, problemas de conduta, hiperatividade, problemas com pares e comportamento pró-social."),

    ("BASC-3",
     "Behavior Assessment System for Children — 3ª Edição",
     "development", "2–21 anos", "10–20 min",
     "Sistema abrangente de avaliação comportamental e emocional. Inclui escalas para pais, professores e auto-relato, além de entrevista estruturada de desenvolvimento."),

    # ── TEA / Neurodesenvolvimento ───────────────────────────────────────
    ("ADOS-2",
     "Autism Diagnostic Observation Schedule — 2ª Edição",
     "autism", "12 meses+", "40–60 min",
     "Padrão-ouro para observação e avaliação de sintomas de autismo. Protocolo observacional semiestruturado com módulos adequados a diferentes níveis de linguagem e faixa etária."),

    ("ADI-R",
     "Autism Diagnostic Interview — Revisado",
     "autism", "Qualquer", "90–150 min",
     "Entrevista diagnóstica estruturada aplicada aos pais/cuidadores. Complementar ao ADOS-2 no diagnóstico de TEA. Avalia histórico de desenvolvimento, comunicação, interação social e padrões restritos."),

    ("M-CHAT-R/F",
     "Modified Checklist for Autism in Toddlers — Revisado com Acompanhamento",
     "autism", "16–30 meses", "5–10 min",
     "Instrumento de rastreio precoce para TEA em crianças pequenas. Aplicado em duas fases: checklist inicial e acompanhamento com entrevista. Validado no Brasil."),

    ("Vineland-3",
     "Vineland Adaptive Behavior Scales — 3ª Edição",
     "autism", "Qualquer", "20–60 min",
     "Avalia comportamento adaptativo em comunicação, habilidades de vida diária, socialização e habilidades motoras. Essencial para diagnóstico de TEA e deficiência intelectual."),

    ("CARS-2",
     "Childhood Autism Rating Scale — 2ª Edição",
     "autism", "2+ anos", "5–10 min",
     "Escala de avaliação de sintomas de autismo baseada em observação clínica. Versões Standard (CARS2-ST) e Alta Funcionalidade (CARS2-HF). Classifica gravidade do autismo."),

    # ── Personalidade e Projetivos ───────────────────────────────────────
    ("Rorschach (R-PAS)",
     "Rorschach — Sistema de Avaliação R-PAS",
     "personality", "5+ anos", "45–90 min",
     "Método projetivo de avaliação da personalidade, percepção e pensamento. O sistema R-PAS oferece normas internacionais atualizadas e estrutura de pontuação padronizada."),

    ("HTP",
     "House-Tree-Person — Técnica Projetiva",
     "personality", "3+ anos", "20–40 min",
     "Técnica projetiva de desenho (casa, árvore, pessoa) que avalia aspectos da personalidade, autoconceito, relações interpessoais e dinâmica emocional."),

    ("TAT",
     "Thematic Apperception Test — TAT",
     "personality", "4+ anos", "60–90 min",
     "Método projetivo que utiliza pranchas com cenas ambíguas para explorar dinâmicas emocionais, relacionamentos interpessoais, necessidades e conflitos inconscientes."),

    ("BDI-II",
     "Inventário de Depressão de Beck — 2ª Edição",
     "personality", "13+ anos", "5–10 min",
     "Escala de autorrelato para avaliação da gravidade de sintomas depressivos. Amplamente utilizado em pesquisa e prática clínica. Alinhado aos critérios diagnósticos do DSM."),

    ("BAI",
     "Inventário de Ansiedade de Beck — BAI",
     "personality", "17–80 anos", "5–10 min",
     "Escala de autorrelato para avaliação da gravidade de sintomas ansiosos. Foco em sintomas somáticos da ansiedade. Complementar ao BDI-II na avaliação de saúde mental."),
]


class Command(BaseCommand):
    help = "Cria o catálogo completo de testes neuropsicológicos e materiais de estoque para todas as clínicas."

    def add_arguments(self, parser):
        parser.add_argument("--qty", type=int, default=0,
                            help="Quantidade inicial de cada material no estoque (padrão: 0)")
        parser.add_argument("--min-qty", type=int, default=4,
                            help="Quantidade mínima de alerta (padrão: 4)")

    def handle(self, *args, **options):
        from apps.neurotests.models import NeurotestScale
        from apps.inventory.models import Product
        from apps.core.models import Clinic

        initial_qty = options["qty"]
        min_qty = options["min_qty"]

        clinics = list(Clinic.objects.all())
        if not clinics:
            self.stderr.write("Nenhuma clínica encontrada. Execute o servidor e faça login primeiro.")
            return

        self.stdout.write(f"Encontrada(s) {len(clinics)} clinica(s). Criando catalogo...")

        created_scales = 0
        created_products = 0

        with transaction.atomic():
            for clinic in clinics:
                self.stdout.write(f"\n  Clinica: {clinic.name}")

                for test_key, full_name, category, age_range, app_time, description in CATALOG:
                    # NeurotestScale
                    scale, scale_created = NeurotestScale.objects.get_or_create(
                        clinic=clinic,
                        abbreviation=test_key,
                        defaults={
                            "name": full_name,
                            "category": category,
                            "age_range": age_range,
                            "application_time": app_time,
                            "description": description,
                            "is_active": True,
                        },
                    )
                    if scale_created:
                        created_scales += 1
                        self.stdout.write(f"    [CRIADO] Teste: {test_key}")
                    else:
                        self.stdout.write(f"    [EXISTE] Teste: {test_key}")

                    # Product (inventory)
                    product_name = f"Protocolo {test_key}"
                    if any(w in test_key for w in ["Test", "Inventário", "Escala", "Checklist", "Rating", "Behavior", "Assessment", "Interview"]):
                        product_name = test_key

                    product, prod_created = Product.objects.get_or_create(
                        clinic=clinic,
                        test_name=test_key,
                        defaults={
                            "name": product_name,
                            "category": _category_to_product_cat(category),
                            "quantity": initial_qty,
                            "min_quantity": min_qty,
                            "unit_price": 0,
                            "is_active": True,
                        },
                    )
                    if prod_created:
                        created_products += 1
                        self.stdout.write(f"      [ESTOQUE] Criado: {product_name} (qtd: {initial_qty})")
                    else:
                        self.stdout.write(f"      [ESTOQUE] Ja existe: {product.name}")

        self.stdout.write(self.style.SUCCESS(
            f"\nConcluido! {created_scales} teste(s) e {created_products} material(is) criado(s)."
        ))


def _category_to_product_cat(cat: str) -> str:
    mapping = {
        "intelligence": "Protocolo",
        "memory": "Protocolo",
        "attention": "Protocolo",
        "development": "Protocolo",
        "autism": "Protocolo",
        "personality": "Protocolo",
        "neuropsych": "Protocolo",
    }
    return mapping.get(cat, "Protocolo")
