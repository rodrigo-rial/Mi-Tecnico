from io import BytesIO
from uuid import uuid4
from pathlib import Path
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Usuario


def ruta_foto(usuario):
    if not usuario.foto_perfil:
        return None
    return f"/usuarios/{usuario.pk}/foto/?v={Path(usuario.foto_perfil.name).stem}"


class FotoEntrada(serializers.Serializer):
    imagen = serializers.ImageField()

    def validate_imagen(self, archivo):
        if archivo.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("La foto puede pesar hasta 5 MB.")
        if archivo.image.format not in {"JPEG", "PNG", "WEBP"}:
            raise serializers.ValidationError("Usá JPG, PNG o WEBP.")
        if max(archivo.image.size) > 6000:
            raise serializers.ValidationError("La imagen puede medir hasta 6000 píxeles por lado.")
        return archivo


class MiFotoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        entrada = FotoEntrada(data=request.data)
        entrada.is_valid(raise_exception=True)
        archivo = entrada.validated_data["imagen"]
        archivo.seek(0)
        with Image.open(archivo) as original:
            imagen = ImageOps.exif_transpose(original).convert("RGB")
            imagen = ImageOps.fit(imagen, (512, 512))
            salida = BytesIO()
            imagen.save(salida, format="JPEG", quality=85)
        with transaction.atomic():
            usuario = Usuario.objects.select_for_update().get(pk=request.user.pk)
            anterior = usuario.foto_perfil.name
            storage = usuario.foto_perfil.storage
            usuario.foto_perfil.save(uuid4().hex + ".jpg", ContentFile(salida.getvalue()), save=False)
            nueva = usuario.foto_perfil.name
            try:
                usuario.save(update_fields=["foto_perfil"])
            except Exception:
                storage.delete(nueva)
                raise
            if anterior:
                transaction.on_commit(lambda: storage.delete(anterior))
        return Response({"foto_perfil": ruta_foto(usuario)})

    def delete(self, request):
        with transaction.atomic():
            usuario = Usuario.objects.select_for_update().get(pk=request.user.pk)
            anterior = usuario.foto_perfil.name
            storage = usuario.foto_perfil.storage
            usuario.foto_perfil = ""
            usuario.save(update_fields=["foto_perfil"])
            if anterior:
                transaction.on_commit(lambda: storage.delete(anterior))
        return Response({"foto_perfil": None})


class FotoUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, usuario_id):
        usuario = get_object_or_404(Usuario, pk=usuario_id, is_active=True)
        if usuario.pk != request.user.pk and not (
            usuario.rol == "TECNICO" and hasattr(usuario, "perfil_tecnico")
            and usuario.perfil_tecnico.estado_validacion == "APROBADO"
        ):
            raise Http404
        if not usuario.foto_perfil or not usuario.foto_perfil.storage.exists(usuario.foto_perfil.name):
            raise Http404
        respuesta = FileResponse(usuario.foto_perfil.open("rb"), content_type="image/jpeg")
        respuesta["Cache-Control"] = "private, no-store"
        return respuesta
