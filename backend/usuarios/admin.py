from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "rol",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "rol",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "MiTécnico",
            {
                "fields": ("rol",),
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "MiTécnico",
            {
                "fields": ("email", "first_name", "last_name", "rol"),
            },
        ),
    )