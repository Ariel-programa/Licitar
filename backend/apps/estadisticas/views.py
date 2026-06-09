from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from apps.licitaciones.models import Licitacion


class ResumenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Licitacion.objects.all()
        return Response({
            "total": qs.count(),
            "abiertas": qs.filter(estado="abierta").count(),
            "cerradas": qs.filter(estado="cerrada").count(),
            "adjudicadas": qs.filter(estado="adjudicada").count(),
            "por_provincia": list(
                qs.values("provincia").annotate(total=Count("id")).order_by("-total")[:10]
            ),
            "por_estado": list(
                qs.values("estado").annotate(total=Count("id")).order_by("-total")
            ),
        })


class NotificacionesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hace_7_dias = timezone.now() - timedelta(days=7)
        nuevas = Licitacion.objects.filter(
            created_at__gte=hace_7_dias
        ).order_by("-created_at")[:10]

        return Response({
            "total": nuevas.count(),
            "items": [
                {
                    "id": l.id,
                    "titulo": l.titulo,
                    "organismo": l.organismo,
                    "estado": l.estado,
                    "created_at": l.created_at,
                }
                for l in nuevas
            ]
        })