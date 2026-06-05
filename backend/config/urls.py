from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView
try:
    from drf_spectacular.views import SpectacularSwaggerUIView
except ImportError:
    from drf_spectacular.views import SpectacularSwaggerView as SpectacularSwaggerUIView


def healthcheck(request):
    return JsonResponse({"status": "ok", "service": "LicitAR API"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", healthcheck),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerUIView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include("apps.users.urls")),
    path("api/licitaciones/", include("apps.licitaciones.urls")),
    path("api/alertas/", include("apps.alertas.urls")),
    path("api/estadisticas/", include("apps.estadisticas.urls")),
]
