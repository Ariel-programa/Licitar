import django_filters
from .models import Licitacion


class LicitacionFilter(django_filters.FilterSet):
    titulo = django_filters.CharFilter(lookup_expr="icontains")
    organismo = django_filters.CharFilter(lookup_expr="icontains")
    estado = django_filters.ChoiceFilter(choices=Licitacion.Estado.choices)
    provincia = django_filters.CharFilter(lookup_expr="icontains")
    rubro = django_filters.CharFilter(lookup_expr="icontains")
    fecha_publicacion_desde = django_filters.DateFilter(field_name="fecha_publicacion", lookup_expr="gte")
    fecha_publicacion_hasta = django_filters.DateFilter(field_name="fecha_publicacion", lookup_expr="lte")
    fecha_apertura_desde = django_filters.DateFilter(field_name="fecha_apertura", lookup_expr="gte")
    fecha_apertura_hasta = django_filters.DateFilter(field_name="fecha_apertura", lookup_expr="lte")
    monto_min = django_filters.NumberFilter(field_name="monto_estimado", lookup_expr="gte")
    monto_max = django_filters.NumberFilter(field_name="monto_estimado", lookup_expr="lte")

    class Meta:
        model = Licitacion
        fields = ["estado", "provincia", "rubro", "fuente"]
