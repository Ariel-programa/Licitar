from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum
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
