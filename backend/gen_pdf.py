from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.renderPDF import GraphicsFlowable

output = "C:/Users/Jean/Desktop/laudo_teste_lucas_tdah_qi.pdf"
buf = open(output, "wb")
doc = SimpleDocTemplate(buf, pagesize=A4,
    rightMargin=2.5*cm, leftMargin=2.5*cm, topMargin=2.5*cm, bottomMargin=2.5*cm)

styles = getSampleStyleSheet()
purple = colors.HexColor("#7C3AED")
dark   = colors.HexColor("#1E1B4B")
gray   = colors.HexColor("#6B7280")

def ps(name, **kw):
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

title_s = ps("T", fontSize=17, textColor=dark,   spaceAfter=4,  fontName="Helvetica-Bold")
meta_s  = ps("M", fontSize=9,  textColor=gray,   spaceAfter=2)
sec_s   = ps("S", fontSize=12, textColor=purple, spaceBefore=14, spaceAfter=5, fontName="Helvetica-Bold")
body_s  = ps("B", fontSize=10, leading=16, textColor=dark, spaceAfter=5)
sub_s   = ps("U", fontSize=11, textColor=dark,   spaceAfter=4,  fontName="Helvetica-Bold")
note_s  = ps("N", fontSize=9,  textColor=gray,   spaceAfter=4,  leftIndent=10)

story = []

# Cabecalho
story.append(Paragraph("Laudo de Avaliacao Neuropsicologica", title_s))
story.append(Paragraph(
    "<b>Paciente:</b> Lucas Almeida dos Santos &nbsp;|&nbsp; "
    "<b>Nasc.:</b> 12/03/2014 (12 anos) &nbsp;|&nbsp; <b>Genero:</b> Masculino", meta_s))
story.append(Paragraph(
    "<b>Profissional:</b> Dra. Ana Paula Ferreira - CRP 06/12345 &nbsp;|&nbsp; "
    "<b>Data:</b> 26/05/2026 &nbsp;|&nbsp; <b>Status:</b> Rascunho para Teste", meta_s))
story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=2, color=purple, spaceAfter=12))

# Secao 1
story.append(Paragraph("1. Identificacao e Motivo da Avaliacao", sec_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))
story.append(Paragraph(
    "Lucas, 12 anos, cursando o 7 ano do Ensino Fundamental, foi encaminhado pela escola e pela "
    "pediatra para avaliacao neuropsicologica em virtude de queixas persistentes de desatencao, "
    "impulsividade, agitacao motora e baixo rendimento academico. Os responsaveis relatam que as "
    "dificuldades estao presentes desde os 6 anos e se intensificaram a partir do 4 ano escolar. "
    "Ha historico familiar positivo de TDAH (pai biologico). Sem uso de medicamentos psicoativos "
    "no momento da avaliacao.", body_s))

# Secao 2
story.append(Paragraph("2. Procedimentos e Instrumentos Utilizados", sec_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))
instrumentos = [
    "WISC-V: Escala Wechsler de Inteligencia para Criancas - 5 Edicao",
    "Conners 3: Escala de Conners para TDAH - 3 Edicao (versao pais e professores)",
    "SNAP-IV: Swanson, Nolan and Pelham Checklist - Versao IV",
    "Trail Making Test (TMT): Partes A e B",
    "Entrevista clinica estruturada com responsaveis e consulta ao historico escolar",
]
for item in instrumentos:
    story.append(Paragraph(f"  •  {item}", body_s))

# Secao 3 - Resultados
story.append(Paragraph("3. Resultados e Analise", sec_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))

# WISC-V tabela
story.append(Paragraph("3.1  WISC-V   Escala de Inteligencia (M=100, DP=15)", sub_s))
wisc_data = [
    ["Indice", "Escore Padrao", "Percentil", "Classificacao"],
    ["QI Total",                          "92", "30", "Medio"],
    ["ICV - Compreensao Verbal",          "98", "45", "Medio"],
    ["IRF - Raciocinio Fluido",           "94", "34", "Medio"],
    ["IVE - Visual Espacial",             "96", "39", "Medio"],
    ["IMT - Memoria de Trabalho",         "78",  "7", "Limitrofe *"],
    ["IVP - Velocidade de Processamento", "72",  "3", "Limitrofe *"],
]
t1 = Table(wisc_data, colWidths=[7.2*cm, 2.5*cm, 2.2*cm, 3.7*cm])
t1.setStyle(TableStyle([
    ("BACKGROUND",  (0, 0), (-1, 0), purple),
    ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
    ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE",    (0, 0), (-1, -1), 9),
    ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F5F3FF"), colors.white]),
    ("PADDING",     (0, 0), (-1, -1), 5),
    ("TEXTCOLOR",   (3, 5), (3, 6), colors.HexColor("#dc2626")),
    ("FONTNAME",    (0, 5), (-1, 6), "Helvetica-Bold"),
]))
story.append(t1)
story.append(Paragraph("* Escores na faixa Limitrofe indicam comprometimento significativo", note_s))
story.append(Spacer(1, 8))

# Grafico WISC-V
story.append(Paragraph("Grafico 1: Perfil de Desempenho WISC-V", sub_s))
d1 = Drawing(460, 165)
wisc_bars = [("QI Total", 92), ("ICV", 98), ("IRF", 94), ("IVE", 96), ("IMT", 78), ("IVP", 72)]
bw, xs, scale = 52, 42, 130 / 160

for rv, rc in [(70, "#dc2626"), (90, "#d97706"), (110, "#16a34a")]:
    y = 15 + rv * scale
    d1.add(Rect(xs, y, 392, 0.9, fillColor=colors.HexColor(rc), strokeColor=None))
    d1.add(String(4, y - 4, str(rv), fontSize=8, fillColor=colors.HexColor(rc)))

for i, (lbl, val) in enumerate(wisc_bars):
    x = xs + i * (bw + 6)
    h = val * scale
    bc = "#16a34a" if val >= 110 else "#3b82f6" if val >= 90 else "#d97706" if val >= 70 else "#dc2626"
    d1.add(Rect(x, 15, bw, h, fillColor=colors.HexColor(bc), strokeColor=None, rx=3))
    d1.add(String(x + bw / 2 - 10, 15 + h + 3, str(val), fontSize=9, fillColor=colors.HexColor(bc)))
    d1.add(String(x + 2, 4, lbl, fontSize=8, fillColor=colors.HexColor("#374151")))

story.append(GraphicsFlowable(d1))
story.append(Spacer(1, 12))

# Conners 3
story.append(Paragraph("3.2  Conners 3   Avaliacao de TDAH  (Escores T: M=50 DP=10)", sub_s))
story.append(Paragraph("Ponto de corte clinico: T >= 65 Elevado  |  T >= 70 Muito Elevado", note_s))
conners_data = [
    ["Escala", "Escore T (Pais)", "Escore T (Professores)", "Classificacao"],
    ["TDAH Total",                    "74", "76", "Muito Elevado"],
    ["Desatencao",                    "78", "80", "Muito Elevado"],
    ["Hiperatividade / Impulsividade","70", "68", "Elevado"],
    ["Problemas de Aprendizagem",     "65", "70", "Elevado"],
    ["Funcionamento Executivo",       "72", "74", "Muito Elevado"],
]
t2 = Table(conners_data, colWidths=[5.8*cm, 2.8*cm, 3.2*cm, 3.8*cm])
t2.setStyle(TableStyle([
    ("BACKGROUND",  (0, 0), (-1, 0), purple),
    ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
    ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE",    (0, 0), (-1, -1), 9),
    ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F5F3FF"), colors.white]),
    ("PADDING",     (0, 0), (-1, -1), 5),
    ("TEXTCOLOR",   (3, 1), (3, -1), colors.HexColor("#dc2626")),
    ("FONTNAME",    (0, 1), (-1, -1), "Helvetica-Bold"),
]))
story.append(t2)
story.append(Spacer(1, 8))

# Grafico Conners
story.append(Paragraph("Grafico 2: Perfil Conners 3 (Escores T)", sub_s))
d2 = Drawing(460, 140)
c_bars = [("TDAH Total", 74), ("Desatencao", 78), ("Hip/Imp", 70), ("Prob.Apren", 65), ("Func.Exec", 72)]
bw2, xs2, sc2 = 56, 42, 110 / 100

for rv2, rc2, rl2 in [(50, "#6b7280", "Media"), (65, "#d97706", "Elevado"), (70, "#dc2626", "Muito Elev.")]:
    y2 = 10 + rv2 * sc2
    d2.add(Rect(xs2, y2, 386, 0.9, fillColor=colors.HexColor(rc2), strokeColor=None))
    d2.add(String(4, y2 - 4, str(rv2), fontSize=8, fillColor=colors.HexColor(rc2)))

for i2, (lbl2, val2) in enumerate(c_bars):
    x2 = xs2 + i2 * (bw2 + 6)
    h2 = val2 * sc2
    bc2 = "#dc2626" if val2 >= 70 else "#d97706" if val2 >= 65 else "#3b82f6"
    d2.add(Rect(x2, 10, bw2, h2, fillColor=colors.HexColor(bc2), strokeColor=None, rx=3))
    d2.add(String(x2 + bw2 / 2 - 10, 10 + h2 + 3, str(val2), fontSize=9, fillColor=colors.HexColor(bc2)))
    d2.add(String(x2 + 2, 2, lbl2, fontSize=8, fillColor=colors.HexColor("#374151")))

story.append(GraphicsFlowable(d2))
story.append(Spacer(1, 10))

# SNAP-IV e TMT
story.append(Paragraph("3.3  SNAP-IV", sub_s))
story.append(Paragraph(
    "Desatencao: 2,3 / 3,0  (acima do ponto de corte >= 1,5)  |  "
    "Hiperatividade/Impulsividade: 1,8 / 3,0  (acima do ponto de corte >= 1,5)  |  "
    "Resultados consistentes com relato de pais e professores.", body_s))

story.append(Paragraph("3.4  Trail Making Test (TMT)", sub_s))
story.append(Paragraph(
    "Parte A: 42 segundos (percentil ~30 - dentro da media)  |  "
    "Parte B: 118 segundos (percentil ~5 - significativamente abaixo da media)  |  "
    "B menos A = 76s: indica comprometimento na flexibilidade cognitiva e controle inibitorio.", body_s))

# Conclusao
story.append(Paragraph("4. Conclusao e Hipotese Diagnostica", sec_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))
story.append(Paragraph(
    "Os resultados obtidos configuram perfil neuropsicologico compativel com "
    "<b>Transtorno de Deficit de Atencao e Hiperatividade (TDAH) - Apresentacao Combinada</b> "
    "(CID-11: 6A05.2 / DSM-5: 314.01). Os indices IMT=78 e IVP=72 no WISC-V posicionam-se na "
    "faixa Limitrofe, consistentes com os prejuizos em memoria de trabalho e velocidade de "
    "processamento frequentemente observados no TDAH. Os escores T elevados na Conners 3, "
    "relatados de forma convergente por pais e professores, o SNAP-IV acima dos pontos de corte "
    "e o desempenho significativamente prejudicado no TMT-B consolidam a hipotese diagnostica. "
    "O QI Total de 92 (faixa Media) afasta deficit intelectual como fator explicativo primario.", body_s))

# Recomendacoes
story.append(Paragraph("5. Recomendacoes", sec_s))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=6))
recs = [
    "Encaminhamento para avaliacao psiquiatrica visando discussao de intervencao farmacologica (metilfenidato ou lisdexanfetamina).",
    "Psicoterapia cognitivo-comportamental com foco em autorregulacao emocional e treinamento de funcoes executivas.",
    "Suporte pedagogico especializado: adaptacoes curriculares, tempo ampliado, reducao de distradores e instrucoes segmentadas.",
    "Programa de orientacao parental com estrategias de manejo comportamental e estruturacao do ambiente domiciliar.",
    "Reavaliacao neuropsicologica em 18 meses para monitoramento da evolucao e eficacia das intervencoes.",
]
for rec in recs:
    story.append(Paragraph(f"  •  {rec}", body_s))

# Assinatura
story.append(Spacer(1, 28))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D1D5DB")))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Documento gerado pelo sistema NeuroSync AI em 26/05/2026  |  "
    "Dra. Ana Paula Ferreira  CRP 06/12345  |  PACIENTE FICTICIO PARA FINS DE TESTE", meta_s))

doc.build(story)
buf.close()
print("PDF gerado:", output)
