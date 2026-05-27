from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Appointment, BlockedSlot
from .serializers import AppointmentSerializer, BlockedSlotSerializer


class AppointmentViewSet(ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["patient__full_name", "professional__first_name", "professional__last_name"]
    ordering_fields = ["scheduled_at", "status", "created_at"]
    ordering = ["scheduled_at"]

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related("patient", "professional", "clinic")

        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)

        # Filtros por query params
        params = self.request.query_params
        if status_filter := params.get("status"):
            qs = qs.filter(status=status_filter)
        if professional_id := params.get("professional"):
            qs = qs.filter(professional_id=professional_id)
        if patient_id := params.get("patient"):
            qs = qs.filter(patient_id=patient_id)
        if date_from := params.get("date_from"):
            qs = qs.filter(scheduled_at__date__gte=date_from)
        if date_to := params.get("date_to"):
            qs = qs.filter(scheduled_at__date__lte=date_to)

        # Profissionais veem apenas sua agenda
        if user.is_neuropsychologist:
            qs = qs.filter(professional=user)

        return qs

    @action(detail=False, methods=["get"], url_path="week")
    def week(self, request):
        """Retorna agendamentos da semana atual ou de uma data específica."""
        date_str = request.query_params.get("date")
        if date_str:
            from datetime import date
            try:
                ref = date.fromisoformat(date_str)
            except ValueError:
                return Response({"detail": "Data inválida."}, status=400)
        else:
            ref = timezone.localdate()

        start = ref - timedelta(days=ref.weekday())
        end = start + timedelta(days=6)

        qs = self.get_queryset().filter(scheduled_at__date__range=[start, end])
        serializer = self.get_serializer(qs, many=True)
        return Response({
            "week_start": start.isoformat(),
            "week_end": end.isoformat(),
            "appointments": serializer.data,
        })

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        today = timezone.localdate()
        qs = self.get_queryset().filter(scheduled_at__date=today)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["patch"], url_path="checkin")
    def checkin(self, request, pk=None):
        appt = self.get_object()
        if appt.status not in ["confirmed", "pending"]:
            return Response({"detail": "Status inválido para check-in."}, status=400)
        appt.checkin_at = timezone.now()
        appt.status = Appointment.Status.IN_PROGRESS
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=["patch"], url_path="checkout")
    def checkout(self, request, pk=None):
        appt = self.get_object()
        if appt.status != "in_progress":
            return Response({"detail": "Status inválido para check-out."}, status=400)
        appt.checkout_at = timezone.now()
        appt.status = Appointment.Status.FINISHED
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        appt = self.get_object()
        if appt.status in ["finished", "canceled"]:
            return Response({"detail": "Não é possível cancelar este agendamento."}, status=400)
        appt.status = Appointment.Status.CANCELED
        appt.save()
        return Response(self.get_serializer(appt).data)

    @action(detail=True, methods=["patch"], url_path="no-show")
    def no_show(self, request, pk=None):
        appt = self.get_object()
        appt.status = Appointment.Status.NO_SHOW
        appt.save()
        return Response(self.get_serializer(appt).data)


class BlockedSlotViewSet(ModelViewSet):
    serializer_class = BlockedSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = BlockedSlot.objects.select_related("professional", "clinic")
        if not user.is_admin_master:
            qs = qs.filter(clinic=user.clinic)
        if professional_id := self.request.query_params.get("professional"):
            qs = qs.filter(professional_id=professional_id)
        return qs
