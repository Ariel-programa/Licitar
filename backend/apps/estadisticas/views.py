from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncMonth
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


class AvanzadasView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Licitacion.objects.all()
        hace_12_meses = (timezone.now() - timedelta(days=365)).date()

        por_mes = (
            qs.filter(fecha_publicacion__gte=hace_12_meses)
            .annotate(mes=TruncMonth("fecha_publicacion"))
            .values("mes")
            .annotate(total=Count("id"))
            .order_by("mes")
        )

        top_rubros = (
            qs.exclude(rubro="")
            .values("rubro")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        montos = qs.filter(monto_estimado__isnull=False).aggregate(
            total=Sum("monto_estimado"),
            promedio=Avg("monto_estimado"),
        )

        return Response({
            "por_mes": [
                {"mes": item["mes"].strftime("%Y-%m"), "total": item["total"]}
                for item in por_mes
                if item["mes"]
            ],
            "top_rubros": list(top_rubros),
            "monto_total": float(montos["total"] or 0),
            "monto_promedio": float(montos["promedio"] or 0),
        })


class NotificacionesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hace_7_dias = timezone.now() - timedelta(days=7)
        qs = Licitacion.objects.filter(created_at__gte=hace_7_dias).order_by("-created_at")
        total = qs.count()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(50, max(1, int(request.query_params.get("page_size", 10))))
        except (ValueError, TypeError):
            page, page_size = 1, 10

        offset = (page - 1) * page_size
        items = qs[offset:offset + page_size]

        return Response({
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": offset + page_size < total,
            "has_previous": page > 1,
            "items": [
                {
                    "id": l.id,
                    "titulo": l.titulo,
                    "organismo": l.organismo,
                    "estado": l.estado,
                    "created_at": l.created_at,
                }
                for l in items
            ]
        })