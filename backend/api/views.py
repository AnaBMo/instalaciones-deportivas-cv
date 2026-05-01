"""
Views de la API REST
Endpoints para instalaciones deportivas con MongoDB
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from pymongo import MongoClient
from django.conf import settings
from bson import ObjectId
import json


class InstalacionPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 100


class InstalacionViewSet(viewsets.ViewSet):
    """
    API endpoint para instalaciones deportivas
    Usa MongoDB directamente con pymongo
    """
    pagination_class = InstalacionPagination
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Conectar a MongoDB
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client.get_database()
        self.collection = self.db['instalaciones']
    
    def list(self, request):
        """Lista instalaciones con filtros opcionales"""
        # Obtener parámetros de filtro
        tipo = request.query_params.get('tipo')
        municipio = request.query_params.get('municipio')
        provincia = request.query_params.get('provincia')
        search = request.query_params.get('search')
        categoria = request.query_params.get('categoria')
        
        # Construir filtro de MongoDB
        filtro = {}
        
        if tipo:
            filtro['tipo'] = tipo
        if municipio:
            filtro['denom_municipio'] = {'$regex': municipio, '$options': 'i'}
        if provincia:
            filtro['denom_provincia'] = {'$regex': provincia, '$options': 'i'}
        if search:
            filtro['$or'] = [
                {'nombre': {'$regex': search, '$options': 'i'}},
                {'direccion': {'$regex': search, '$options': 'i'}}
            ]
        # AÑADIR: Filtro por categoría
        if categoria:
            filtro['categorias'] = {'$regex': categoria, '$options': 'i'}
        
        # Contar total con filtros
        total_count = self.collection.count_documents(filtro)
        
        # Paginación manual
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        skip = (page - 1) * page_size
        
        # Calcular total de páginas
        total_pages = (total_count + page_size - 1) // page_size
        
        # Ejecutar query
        cursor = self.collection.find(filtro).skip(skip).limit(page_size)
        resultados = list(cursor)
        
        # Convertir ObjectId a string
        for resultado in resultados:
            resultado['_id'] = str(resultado['_id'])
        
        # Calcular URLs de navegación
        base_url = request.build_absolute_uri().split('?')[0]
        
        # Preservar parámetros de filtro en next/previous
        params = request.query_params.copy()
        
        # Next
        if page < total_pages:
            params['page'] = page + 1
            next_page = f"{base_url}?{params.urlencode()}"
        else:
            next_page = None
        
        # Previous
        if page > 1:
            params['page'] = page - 1
            prev_page = f"{base_url}?{params.urlencode()}"
        else:
            prev_page = None
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'next': next_page,
            'previous': prev_page,
            'results': resultados
        })
    
    def retrieve(self, request, pk=None):
        """
        GET /api/instalaciones/{id}/
        Detalle de una instalación
        """
        try:
            instalacion = self.collection.find_one({'_id': ObjectId(pk)})
            if instalacion:
                instalacion['_id'] = str(instalacion['_id'])
                return Response(instalacion)
            return Response(
                {'error': 'Instalación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except:
            return Response(
                {'error': 'ID inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/instalaciones/stats/
        Estadísticas generales
        """
        total = self.collection.count_documents({})
        
        # Contar por tipo
        pipeline_tipo = [
            {'$group': {'_id': '$tipo', 'count': {'$sum': 1}}}
        ]
        por_tipo = {item['_id']: item['count'] for item in self.collection.aggregate(pipeline_tipo)}
        
        # Contar por provincia
        pipeline_prov = [
            {'$group': {'_id': '$denom_provincia', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        por_provincia = {
            item['_id']: item['count'] 
            for item in self.collection.aggregate(pipeline_prov)
            if item['_id']
        }
        
        stats = {
            'total': total,
            'por_tipo': por_tipo,
            'por_provincia': por_provincia,
        }
        
        return Response(stats)