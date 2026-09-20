from django.db import migrations


ESPECIALIDADES_INICIALES = (
    "Electricidad",
    "Gas",
    "Plomería",
    "Refrigeración",
)


def cargar_especialidades(apps, schema_editor):
    Especialidad = apps.get_model("tecnicos", "Especialidad")
    for nombre in ESPECIALIDADES_INICIALES:
        Especialidad.objects.get_or_create(
            nombre=nombre,
            defaults={"activa": True},
        )


def quitar_especialidades(apps, schema_editor):
    Especialidad = apps.get_model("tecnicos", "Especialidad")
    Especialidad.objects.filter(nombre__in=ESPECIALIDADES_INICIALES).delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "tecnicos",
            "0002_perfiltecnico_dni_numero_perfiltecnico_documento_dni_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(cargar_especialidades, quitar_especialidades),
    ]
