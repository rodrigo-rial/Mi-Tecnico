from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("solicitudes", "0005_fotosolicitud"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [migrations.AddField(
        model_name="solicitud", name="tecnico_destinatario",
        field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT,
                                related_name="solicitudes_dirigidas", to=settings.AUTH_USER_MODEL),
    )]
