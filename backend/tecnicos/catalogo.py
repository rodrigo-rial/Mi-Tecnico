from django.db.models import Avg, Count, Q
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from usuarios.permissions import EsCliente
from .models import PerfilTecnico


class Filtros(serializers.Serializer):
    zona = serializers.IntegerField(min_value=1, required=False)
    especialidad = serializers.IntegerField(min_value=1, required=False)


class Ficha(serializers.ModelSerializer):
    id = serializers.IntegerField(source="usuario_id")
    nombre = serializers.SerializerMethodField()
    especialidades = serializers.SlugRelatedField(many=True, read_only=True, slug_field="nombre")
    zonas = serializers.SlugRelatedField(many=True, read_only=True, slug_field="nombre")
    promedio = serializers.FloatField(read_only=True, allow_null=True)
    cantidad = serializers.IntegerField(read_only=True)

    def get_nombre(self, obj):
        return obj.usuario.get_full_name() or obj.usuario.username

    class Meta:
        model = PerfilTecnico
        fields = ["id", "nombre", "descripcion", "especialidades", "zonas", "promedio", "cantidad"]


class Paginas(PageNumberPagination):
    page_size = 12


class CatalogoTecnicosView(ListAPIView):
    permission_classes = [EsCliente]
    serializer_class = Ficha
    pagination_class = Paginas

    def get_queryset(self):
        filtros = Filtros(data=self.request.query_params)
        filtros.is_valid(raise_exception=True)
        perfiles = PerfilTecnico.objects.filter(usuario__is_active=True, usuario__rol="TECNICO", estado_validacion="APROBADO")
        for campo, relacion in [("zona", "zonas"), ("especialidad", "especialidades")]:
            if campo in filtros.validated_data:
                perfiles = perfiles.filter(**{relacion + "__pk": filtros.validated_data[campo], relacion + "__activa": True})
        terminadas = Q(usuario__calificaciones_recibidas__trabajo__estado="finalizado")
        return perfiles.select_related("usuario").prefetch_related("especialidades", "zonas").annotate(
            promedio=Avg("usuario__calificaciones_recibidas__puntaje", filter=terminadas),
            cantidad=Count("usuario__calificaciones_recibidas", filter=terminadas, distinct=True),
        ).order_by("usuario__first_name", "usuario_id")
