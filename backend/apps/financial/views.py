from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.select_related("patient", "appointment")
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        params = self.request.query_params
        if type_filter := params.get("type"):
            qs = qs.filter(type=type_filter)
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)
        if date_from := params.get("date_from"):
            qs = qs.filter(due_date__gte=date_from)
        if date_to := params.get("date_to"):
            qs = qs.filter(due_date__lte=date_to)
        if patient_id := params.get("patient"):
            qs = qs.filter(patient_id=patient_id)

        return qs

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        month_str = request.query_params.get("month")
        if month_str:
            try:
                from datetime import datetime
                parsed = datetime.strptime(month_str, "%Y-%m")
                year, month = parsed.year, parsed.month
            except ValueError:
                return Response(
                    {"detail": "Formato de mês inválido. Use YYYY-MM."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            now = timezone.now()
            year, month = now.year, now.month

        user = request.user
        qs = Transaction.objects.filter(
            created_at__year=year,
            created_at__month=month,
        )
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        income = Decimal("0.00")
        expense = Decimal("0.00")
        count = 0

        for tx in qs:
            count += 1
            if tx.type == Transaction.Type.INCOME:
                income += tx.amount
            else:
                expense += tx.amount

        balance = income - expense
        return Response(
            {
                "income": income,
                "expense": expense,
                "balance": balance,
                "count": count,
            }
        )

    @action(detail=False, methods=["get"], url_path="patient-margin")
    def patient_margin(self, request):
        user = request.user
        qs = Transaction.objects.select_related("patient")
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        patient_id = request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        margins: dict = {}
        for tx in qs:
            if not tx.patient_id:
                continue
            pid = str(tx.patient_id)
            if pid not in margins:
                margins[pid] = {
                    "patient_id": pid,
                    "patient_name": tx.patient.full_name if tx.patient else "—",
                    "income": Decimal("0.00"),
                    "expense": Decimal("0.00"),
                }
            if tx.type == Transaction.Type.INCOME:
                margins[pid]["income"] += tx.amount
            else:
                margins[pid]["expense"] += tx.amount

        result = []
        for m in margins.values():
            margin = m["income"] - m["expense"]
            margin_pct = (
                round(float(margin) / float(m["income"]) * 100, 1)
                if m["income"] > 0
                else 0
            )
            result.append({
                "patient_id": m["patient_id"],
                "patient_name": m["patient_name"],
                "income": m["income"],
                "expense": m["expense"],
                "margin": margin,
                "margin_pct": margin_pct,
            })

        result.sort(key=lambda x: x["margin"], reverse=True)
        return Response(result)

    @action(detail=True, methods=["patch"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = Transaction.Status.PAID
        transaction.paid_at = timezone.now()
        transaction.save(update_fields=["status", "paid_at", "updated_at"])
        return Response(
            TransactionSerializer(transaction, context={"request": request}).data
        )
