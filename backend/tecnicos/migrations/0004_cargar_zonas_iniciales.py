from django.db import migrations


ZONAS_INICIALES = (
    "La Plata — casco urbano",
    "Tolosa",
    "Ringuelet",
    "Gonnet",
    "City Bell",
    "Villa Elisa",
    "Los Hornos",
    "Berisso",
    "Ensenada",
    "Berazategui",
    "Ranelagh",
    "Hudson",
    "Quilmes",
    "Bernal",
    "Don Bosco",
    "Ezpeleta",
    "Florencio Varela",
    "Wilde",
    "Avellaneda",
    "Lanús",
    "Banfield",
    "Lomas de Zamora",
    "Temperley",
    "La Boca",
    "Barracas",
    "Constitución",
    "San Telmo",
    "Monserrat",
    "Balvanera",
    "Almagro",
    "Caballito",
    "Flores",
    "Palermo",
)


def cargar_zonas(apps, schema_editor):
    Zona = apps.get_model("tecnicos", "Zona")
    for nombre in ZONAS_INICIALES:
        Zona.objects.using(schema_editor.connection.alias).get_or_create(
            nombre=nombre, defaults={"activa": True},
        )


class Migration(migrations.Migration):
    dependencies = [("tecnicos", "0003_cargar_especialidades_iniciales")]

    # Conservar las zonas al revertir: pueden estar vinculadas a perfiles.
    operations = [migrations.RunPython(cargar_zonas, migrations.RunPython.noop)]
