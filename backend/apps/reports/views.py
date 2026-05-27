import io
from django.conf import settings
from django.utils import timezone
from django.http import FileResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Report, ReportTemplate, ReportVersion
from .serializers import ReportSerializer, ReportTemplateSerializer, ReportVersionSerializer


class ReportTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ReportTemplate.objects.filter(is_active=True)
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)
        return qs


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Report.objects.select_related("patient", "professional", "template")
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)
        if user.is_neuropsychologist:
            qs = qs.filter(professional=user)

        params = self.request.query_params
        if patient_id := params.get("patient"):
            qs = qs.filter(patient_id=patient_id)
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        report = self.get_object()
        versions = ReportVersion.objects.filter(report=report)
        return Response(ReportVersionSerializer(versions, many=True).data)

    @action(detail=True, methods=["post"], url_path="sign")
    def sign(self, request, pk=None):
        report = self.get_object()
        if report.status == Report.Status.SIGNED:
            return Response({"detail": "Laudo já assinado."}, status=400)
        signed_by_name = request.data.get("signed_by_name", "").strip()
        if not signed_by_name:
            return Response({"detail": "Informe o nome completo para assinar."}, status=400)
        report.status = Report.Status.SIGNED
        report.signed_at = timezone.now()
        report.signed_by_name = signed_by_name
        report.save()
        return Response(ReportSerializer(report, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="pdf")
    def generate_pdf(self, request, pk=None):
        report = self.get_object()
        try:
            pdf_buffer = _build_pdf(report)
            filename = f"laudo_{str(report.id)[:8]}.pdf"
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=filename,
                content_type="application/pdf",
            )
        except Exception as e:
            return Response({"detail": f"Erro ao gerar PDF: {str(e)}"}, status=500)

    @action(detail=True, methods=["post"], url_path="analyze-scores")
    def analyze_scores(self, request, pk=None):
        report = self.get_object()
        test_scores = request.data.get("test_scores", {})
        if not test_scores:
            return Response({"detail": "Nenhuma pontuação fornecida."}, status=400)

        # Salva as pontuações no relatório
        report.test_scores = test_scores
        report.save(update_fields=["test_scores", "updated_at"])

        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            return Response({"detail": "GROQ_API_KEY não configurada no servidor."}, status=503)

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")

            patient = report.patient
            gender_str = "Masculino" if patient.gender == "M" else "Feminino" if patient.gender == "F" else "Outro"

            # Monta bloco de resultados por teste
            scores_text = ""
            for test_name, scores in test_scores.items():
                scores_text += f"\n{'='*50}\n{test_name}\n"
                for score_key, score_val in scores.items():
                    if score_val not in ("", None):
                        scores_text += f"  • {score_key}: {score_val}\n"

            section_names = [s["title"] for s in report.sections]

            prompt = f"""Você é um neuropsicólogo clínico sênior brasileiro. Gere um laudo neuropsicológico COMPLETO e PROFISSIONAL com base nos resultados abaixo.

DADOS DO PACIENTE:
Nome: {patient.full_name}
Data de Nascimento: {patient.date_of_birth or "não informado"}
Gênero: {gender_str}
Título do Laudo: {report.title}

RESULTADOS DA AVALIAÇÃO:
{scores_text}

REFERÊNCIAS PARA INTERPRETAÇÃO:
Escores Padronizados (M=100, DP=15): <70 Extremamente Baixo | 70-79 Limítrofe | 80-89 Médio Inferior | 90-109 Médio | 110-119 Médio Superior | 120-129 Superior | ≥130 Muito Superior
Escores T (M=50, DP=10): <40 Baixo | 40-59 Médio | 60-64 Levemente Elevado | 65-69 Elevado | ≥70 Muito Elevado
Percentis: <5 Muito Abaixo | 5-25 Abaixo da Média | 25-75 Médio | 75-95 Acima da Média | >95 Muito Acima

INSTRUÇÕES CRÍTICAS:
- Gere o conteúdo completo para CADA UMA das {len(section_names)} seções
- Use linguagem técnica, clínica e formal em português brasileiro
- Na seção "Resultados e Análise" seja MUITO detalhado: analise cada teste, cada índice, suas implicações
- Formule hipóteses diagnósticas fundamentadas nos dados (CID-11/DSM-5)
- Recomendações devem ser específicas, práticas e baseadas nos achados

FORMATO DE RESPOSTA (use EXATAMENTE estes marcadores):
[SECAO_1]
{section_names[0] if len(section_names) > 0 else "Identificação e Motivo da Avaliação"}
conteúdo...
[/SECAO_1]

[SECAO_2]
{section_names[1] if len(section_names) > 1 else "Histórico Clínico e Desenvolvimento"}
conteúdo...
[/SECAO_2]

[SECAO_3]
{section_names[2] if len(section_names) > 2 else "Procedimentos e Instrumentos Utilizados"}
conteúdo...
[/SECAO_3]

[SECAO_4]
{section_names[3] if len(section_names) > 3 else "Resultados e Análise"}
conteúdo...
[/SECAO_4]

[SECAO_5]
{section_names[4] if len(section_names) > 4 else "Conclusão e Hipótese Diagnóstica"}
conteúdo...
[/SECAO_5]

[SECAO_6]
{section_names[5] if len(section_names) > 5 else "Recomendações"}
conteúdo...
[/SECAO_6]"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=4000,
                messages=[
                    {"role": "system", "content": "Você é um neuropsicólogo clínico sênior especialista em avaliação neuropsicológica. Escreva laudos completos, técnicos e profissionais em português brasileiro."},
                    {"role": "user", "content": prompt},
                ],
            )

            raw = response.choices[0].message.content

            # Extrai seções da resposta
            import re
            new_sections = list(report.sections)
            for i, section in enumerate(new_sections):
                pattern = rf"\[SECAO_{i+1}\](.*?)\[/SECAO_{i+1}\]"
                match = re.search(pattern, raw, re.DOTALL)
                if match:
                    content = match.group(1).strip()
                    # Remove linha do título se repetida
                    lines = content.split("\n")
                    if lines and lines[0].strip() == section["title"]:
                        content = "\n".join(lines[1:]).strip()
                    new_sections[i] = {**section, "content": content}

            # Salva versão + incrementa
            from .models import ReportVersion
            ReportVersion.objects.create(
                report=report,
                version_number=report.version,
                sections_snapshot=report.sections,
                saved_by=request.user,
            )
            report.sections = new_sections
            report.version += 1
            report.save(update_fields=["sections", "version", "updated_at"])

            return Response(ReportSerializer(report, context={"request": request}).data)

        except Exception as e:
            return Response({"detail": f"Erro na IA: {str(e)}"}, status=500)

    @action(detail=True, methods=["post"], url_path="upload-assessment")
    def upload_assessment(self, request, pk=None):
        report = self.get_object()
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Nenhum arquivo enviado."}, status=400)
        report.assessment_file = file
        report.save(update_fields=["assessment_file", "updated_at"])
        return Response(ReportSerializer(report, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="ai-assist")
    def ai_assist(self, request, pk=None):
        report = self.get_object()
        section_title = request.data.get("section_title", "")
        current_content = request.data.get("current_content", "")
        instruction = request.data.get("instruction", "melhore e expanda o texto")

        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            return Response({"detail": "GROQ_API_KEY não configurada no servidor. Obtenha sua chave gratuita em console.groq.com"}, status=503)

        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
            )

            patient = report.patient
            patient_info = (
                f"Nome: {patient.full_name}, "
                f"Data de nascimento: {patient.date_of_birth or 'não informado'}, "
                f"Gênero: {'Masculino' if patient.gender == 'M' else 'Feminino' if patient.gender == 'F' else 'Outro'}"
            )

            prompt = (
                "Você é um neuropsicólogo clínico experiente redigindo um laudo neuropsicológico "
                "profissional em português brasileiro.\n\n"
                f"Dados do paciente: {patient_info}\n"
                f"Título do laudo: {report.title}\n"
                f"Seção a ser redigida: {section_title}\n\n"
                f"Conteúdo atual desta seção:\n{current_content or '(ainda não preenchido)'}\n\n"
                f"Instrução: {instruction}\n\n"
                "Use linguagem técnica, clara e objetiva conforme padrões clínicos brasileiros. "
                "Retorne APENAS o texto aprimorado da seção, sem títulos, sem comentários extras."
            )

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=1500,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um neuropsicólogo clínico experiente que auxilia na redação "
                            "de laudos neuropsicológicos profissionais em português brasileiro."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            suggestion = response.choices[0].message.content
            return Response({"suggestion": suggestion})
        except Exception as e:
            return Response({"detail": f"Erro na IA: {str(e)}"}, status=500)


def _build_pdf(report: Report) -> io.BytesIO:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2.5 * cm, leftMargin=2.5 * cm,
        topMargin=2.5 * cm, bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    purple = colors.HexColor("#7C3AED")

    title_style = ParagraphStyle(
        "LaudoTitle", parent=styles["Title"],
        fontSize=18, textColor=colors.HexColor("#1E1B4B"),
        spaceAfter=4, fontName="Helvetica-Bold",
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#6B7280"), spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "SectionHead", parent=styles["Normal"],
        fontSize=12, textColor=purple, spaceBefore=16, spaceAfter=6,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=16, textColor=colors.HexColor("#374151"), spaceAfter=6,
    )

    story = []

    # Cabeçalho
    story.append(Paragraph(report.title, title_style))
    story.append(Paragraph(
        f"Paciente: <b>{report.patient.full_name}</b>  |  "
        f"Profissional: <b>{report.professional.get_full_name() or report.professional.username}</b>  |  "
        f"Data: <b>{report.created_at.strftime('%d/%m/%Y')}</b>",
        meta_style,
    ))
    status_map = {"draft": "Rascunho", "review": "Em Revisão", "signed": "Assinado"}
    story.append(Paragraph(
        f"Status: <b>{status_map.get(report.status, report.status)}</b>  |  Versão: <b>{report.version}</b>",
        meta_style,
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=purple, spaceAfter=14))

    # Seções
    for section in report.sections:
        story.append(Paragraph(section.get("title", ""), section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=8))
        content = section.get("content", "").strip()
        if content:
            for para in content.split("\n\n"):
                if para.strip():
                    story.append(Paragraph(para.strip().replace("\n", "<br/>"), body_style))
        else:
            story.append(Paragraph("<i>Não preenchido.</i>", body_style))

    # Assinatura
    if report.status == "signed" and report.signed_at:
        story.append(Spacer(1, 28))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D1D5DB")))
        story.append(Spacer(1, 6))
        signer = report.signed_by_name or report.professional.get_full_name() or report.professional.username
        story.append(Paragraph(
            f"Documento assinado digitalmente por <b>{signer}</b> em "
            f"{report.signed_at.strftime('%d/%m/%Y às %H:%M')}.",
            meta_style,
        ))

    # Gráfico de barras dos escores (se houver dados numéricos)
    chart_data = []
    for test_name, scores in report.test_scores.items():
        for score_label, score_val in scores.items():
            try:
                val = float(str(score_val).replace(",", "."))
                chart_data.append((f"{test_name[:12]}\n{score_label[:14]}", val))
            except (ValueError, TypeError):
                pass

    if chart_data:
        from reportlab.graphics.shapes import Drawing, String, Rect
        from reportlab.graphics import renderPDF
        from reportlab.lib import colors as rl_colors

        chart_data = chart_data[:12]  # máximo 12 barras
        drawing_w, drawing_h = 460, 160
        drawing = Drawing(drawing_w, drawing_h)

        bar_count = len(chart_data)
        bar_w = min(32, (drawing_w - 60) // bar_count - 4)
        max_val = max(v for _, v in chart_data) if chart_data else 1
        max_val = max(max_val, 100)
        scale = 110 / max_val
        x_start = 40

        # Linhas de referência
        for ref_val, ref_label, ref_color in [(70, "70", "#dc2626"), (90, "90", "#d97706"), (110, "110", "#16a34a")]:
            y_ref = 15 + ref_val * scale
            if y_ref < drawing_h - 10:
                drawing.add(Rect(x_start, y_ref, drawing_w - x_start - 10, 0.5, fillColor=rl_colors.HexColor(ref_color), strokeColor=None))
                drawing.add(String(5, y_ref - 4, ref_label, fontSize=7, fillColor=rl_colors.HexColor(ref_color)))

        for idx, (label, val) in enumerate(chart_data):
            x = x_start + idx * (bar_w + 4)
            bar_h = max(4, val * scale)
            bar_color = "#7c3aed" if val >= 90 else "#d97706" if val >= 70 else "#dc2626"
            drawing.add(Rect(x, 15, bar_w, bar_h, fillColor=rl_colors.HexColor(bar_color), strokeColor=None))
            drawing.add(String(x + bar_w / 2 - 8, 15 + bar_h + 2, str(int(val)), fontSize=7, fillColor=rl_colors.HexColor("#1e1b4b")))
            for line_part in label.split("\n"):
                pass  # labels omitted for brevity in small PDF

        story.append(Spacer(1, 14))
        story.append(Paragraph("Perfil de Desempenho", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=8))
        story.append(renderPDF.GraphicsFlowable(drawing) if hasattr(renderPDF, "GraphicsFlowable") else Spacer(1, 0))
        from reportlab.graphics.renderPDF import GraphicsFlowable  # noqa
        try:
            story.append(GraphicsFlowable(drawing))
        except Exception:
            pass

    doc.build(story)
    buffer.seek(0)
    return buffer
