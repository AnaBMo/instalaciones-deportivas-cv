"""
Serializers para la API REST
Convierten modelos Django <-> JSON
"""
from rest_framework import serializers
from .models import Instalacion


class InstalacionSerializer(serializers.ModelSerializer):
    """
    Serializer completo para instalaciones
    """
    class Meta:
        model = Instalacion
        fields = [
            'id',
            'codigo',
            'nombre',
            'direccion',
            'latitud',
            'longitud',
            'cod_postal',
            'cod_provincia',
            'denom_provincia',
            'cod_municipio',
            'denom_municipio',
            'tipo',
            'categorias',
            'deportes_raw',
            'telefono',
            'email',
            'url',
            'rating',
            'total_reviews',
            'place_id',
            'anyo_inicio',
            'creado_en',
            'actualizado_en',
        ]
        read_only_fields = ['id', 'creado_en', 'actualizado_en']


class InstalacionListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para listados (menos campos)
    """
    class Meta:
        model = Instalacion
        fields = [
            'id',
            'nombre',
            'direccion',
            'latitud',
            'longitud',
            'tipo',
            'categorias',
            'rating',
            'denom_municipio',
        ]


class InstalacionMapSerializer(serializers.ModelSerializer):
    """
    Serializer para el mapa (solo lo esencial)
    """
    class Meta:
        model = Instalacion
        fields = [
            'id',
            'nombre',
            'latitud',
            'longitud',
            'tipo',
            'categorias',
        ]