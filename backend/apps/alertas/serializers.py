from rest_framework import serializers
from .models import Alerta


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = ["id", "nombre", "palabras_clave", "provincia", "rubro", "canal", "activa", "created_at"]
        read_only_fields = ["id", "created_at"]
