from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["email", "username", "role", "empresa", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "username", "empresa"]
    fieldsets = UserAdmin.fieldsets + (
        ("LicitAR", {"fields": ("role", "empresa", "telefono", "telegram_chat_id")}),
    )
