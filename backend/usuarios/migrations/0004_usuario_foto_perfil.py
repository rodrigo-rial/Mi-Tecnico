from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("usuarios", "0003_usuario_domicilio_referencia_usuario_telefono")]
    operations = [migrations.AddField(model_name="usuario", name="foto_perfil", field=models.ImageField(upload_to="avatares/", blank=True, default=""))]
