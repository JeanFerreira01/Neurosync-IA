from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.permissions import IsClinicAdmin
from .models import Patient, MedicalRecord, Document
from .serializers import PatientDetailSerializer, PatientListSerializer, MedicalRecordSerializer, DocumentSerializer


class PatientViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["full_name", "cpf", "email", "phone"]
    ordering_fields = ["full_name", "created_at", "date_of_birth"]
    ordering = ["full_name"]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_master:
            qs = Patient.objects.all()
        else:
            qs = Patient.objects.filter(clinic=user.clinic)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs.select_related("medical_record")

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientDetailSerializer

    @action(detail=True, methods=["get", "patch"], url_path="medical-record")
    def medical_record(self, request, pk=None):
        patient = self.get_object()
        record, _ = MedicalRecord.objects.get_or_create(patient=patient)
        if request.method == "PATCH":
            serializer = MedicalRecordSerializer(record, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(MedicalRecordSerializer(record).data)

    @action(detail=True, methods=["get", "post"], url_path="documents")
    def documents(self, request, pk=None):
        patient = self.get_object()
        if request.method == "POST":
            serializer = DocumentSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save(patient=patient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        docs = Document.objects.filter(patient=patient)
        return Response(DocumentSerializer(docs, many=True).data)

    @action(detail=True, methods=["patch"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        patient = self.get_object()
        patient.is_active = False
        patient.save()
        return Response({"detail": "Paciente desativado."})
