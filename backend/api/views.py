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
        """
        GET /api/instalaciones/
        Lista todas las instalaciones con filtros opcionales
        """
        # Construir query de filtros
        query = {}
        
        # Filtro por tipo
        if 'tipo' in request.query_params:
            query['tipo'] = request.query_params['tipo']
        
        # Filtro por municipio
        if 'municipio' in request.query_params:
            query['denom_municipio'] = {
                '$regex': request.query_params['municipio'],
                '$options': 'i'
            }
        
        # Filtro por provincia
        if 'provincia' in request.query_params:
            query['denom_provincia'] = {
                '$regex': request.query_params['provincia'],
                '$options': 'i'
            }
        
        # Búsqueda por nombre
        if 'search' in request.query_params:
            query['nombre'] = {
                '$regex': request.query_params['search'],
                '$options': 'i'
            }
        
        # Obtener datos
        instalaciones = list(self.collection.find(query).limit(100))
        
        # Convertir ObjectId a string
        for inst in instalaciones:
            inst['_id'] = str(inst['_id'])
        
        return Response({
            'count': len(instalaciones),
            'results': instalaciones
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