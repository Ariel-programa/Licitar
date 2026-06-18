from django.urls import path, include
from rest_framework.routers import SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView, CustomTokenObtainPairView, UserViewSet, GoogleLoginView

router = SimpleRouter()
router.register("usuarios", UserViewSet, basename="usuario")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]