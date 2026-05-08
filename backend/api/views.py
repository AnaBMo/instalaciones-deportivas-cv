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
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from datetime import datetime


class InstalacionPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 100


def aplicar_filtro_tipos_categorias(filtro, tipo, categorias):
    """
    Aplica la lógica combinada de tipos + categorías al filtro.
    Los tipos sin categorías (publico, camping) pasan directo.
    Los tipos con categorías (privado, tienda) se filtran por categoría.
    """
    if tipo:
        tipos_lista = [t.strip() for t in tipo.split(',')]
        categorias_lista = [cat.strip() for cat in categorias.split(',')] if categorias else []

        if categorias_lista:
            tipos_con_categorias = [t for t in tipos_lista if t in ('privado', 'tienda')]
            tipos_sin_categorias = [t for t in tipos_lista if t not in ('privado', 'tienda')]

            condiciones = []

            if tipos_con_categorias:
                condiciones.append({
                    'tipo': {'$in': tipos_con_categorias} if len(tipos_con_categorias) > 1 else tipos_con_categorias[0],
                    'categorias': {'$in': categorias_lista}
                })

            if tipos_sin_categorias:
                condiciones.append({
                    'tipo': {'$in': tipos_sin_categorias} if len(tipos_sin_categorias) > 1 else tipos_sin_categorias[0]
                })

            if len(condiciones) == 1:
                filtro.update(condiciones[0])
            elif len(condiciones) > 1:
                if '$or' in filtro:
                    filtro['$and'] = [
                        {'$or': filtro.pop('$or')},
                        {'$or': condiciones}
                    ]
                else:
                    filtro['$or'] = condiciones
        else:
            if len(tipos_lista) == 1:
                filtro['tipo'] = tipos_lista[0]
            else:
                filtro['tipo'] = {'$in': tipos_lista}
    elif categorias:
        categorias_lista = [cat.strip() for cat in categorias.split(',')]
        filtro['categorias'] = {'$in': categorias_lista}


class InstalacionViewSet(viewsets.ViewSet):
    """
    API endpoint para instalaciones deportivas
    Usa MongoDB directamente con pymongo
    """
    permission_classes = [IsAuthenticatedOrReadOnly] 
    pagination_class = InstalacionPagination
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Conectar a MongoDB
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client.get_database()
        self.collection = self.db['instalaciones']
    
    def list(self, request):
        """Lista instalaciones con filtros opcionales"""
        tipo = request.query_params.get('tipo')
        municipio = request.query_params.get('municipio')
        provincia = request.query_params.get('provincia')
        search = request.query_params.get('search')
        categoria = request.query_params.get('categoria')
        categorias = request.query_params.get('categorias')
        
        filtro = {}
        
        if municipio:
            filtro['denom_municipio'] = {'$regex': municipio, '$options': 'i'}
        if provincia:
            filtro['denom_provincia'] = {'$regex': provincia, '$options': 'i'}
        if search:
            filtro['$or'] = [
                {'nombre': {'$regex': search, '$options': 'i'}},
                {'direccion': {'$regex': search, '$options': 'i'}}
            ]
        # Filtro por categoría única (legacy)
        if categoria and not categorias:
            filtro['categorias'] = {'$regex': categoria, '$options': 'i'}
        
        # Lógica combinada de tipos + categorías
        aplicar_filtro_tipos_categorias(filtro, tipo, categorias)
        
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
    
    def create(self, request):
        """
        POST /api/instalaciones/
        Crear nueva instalación
        Requiere autenticación
        """
        try:
            data = request.data.copy()
            
            # Validar campos requeridos
            campos_requeridos = ['nombre', 'direccion', 'latitud', 'longitud', 'tipo']
            for campo in campos_requeridos:
                if campo not in data:
                    return Response(
                        {'error': f'El campo {campo} es requerido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Agregar metadata
            data['creado_por'] = request.user.username
            data['creado_por_id'] = request.user.id
            data['fecha_creacion'] = datetime.now()
            
            # Insertar en MongoDB
            result = self.collection.insert_one(data)
            
            # Recuperar el documento creado
            instalacion = self.collection.find_one({'_id': result.inserted_id})
            instalacion['_id'] = str(instalacion['_id'])
            
            return Response(instalacion, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, pk=None):
        """
        PUT /api/instalaciones/{id}/
        Actualizar instalación completa
        Requiere autenticación
        """
        try:
            from bson import ObjectId
            obj_id = ObjectId(pk)
            
            # Verificar que existe
            instalacion = self.collection.find_one({'_id': obj_id})
            if not instalacion:
                return Response(
                    {'error': 'Instalación no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Preparar datos
            data = request.data.copy()
            data['modificado_por'] = request.user.username
            data['modificado_por_id'] = request.user.id
            data['fecha_modificacion'] = datetime.now()
            
            # Actualizar
            result = self.collection.update_one(
                {'_id': obj_id},
                {'$set': data}
            )
            
            if result.modified_count > 0:
                # Recuperar documento actualizado
                instalacion = self.collection.find_one({'_id': obj_id})
                instalacion['_id'] = str(instalacion['_id'])
                return Response(instalacion)
            else:
                return Response(
                    {'error': 'No se realizaron cambios'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, pk=None):
        """
        DELETE /api/instalaciones/{id}/
        Elimina una instalación (con backup previo)
        Requiere autenticación
        """
        try:
            from bson import ObjectId
            obj_id = ObjectId(pk)
            
            # Buscar la instalación
            instalacion = self.collection.find_one({'_id': obj_id})
            
            if not instalacion:
                return Response(
                    {'error': 'Instalación no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # BACKUP: Guardar en colección de eliminados
            eliminados_collection = self.db['instalaciones_eliminadas']
            
            backup_data = {
                **instalacion,  # Todos los datos originales
                'eliminado_por': request.user.username,
                'eliminado_por_id': request.user.id,
                'fecha_eliminacion': datetime.now(),
                'razon': request.data.get('razon', 'No especificada'),
                'instalacion_id_original': str(instalacion['_id'])
            }
            
            # Guardar backup
            eliminados_collection.insert_one(backup_data)
            
            # Ahora sí eliminar
            result = self.collection.delete_one({'_id': obj_id})
            
            if result.deleted_count > 0:
                return Response(
                    {
                        'message': 'Instalación eliminada correctamente',
                        'backup_guardado': True,
                        'eliminado_por': request.user.username
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'No se pudo eliminar la instalación'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    @action(detail=False, methods=['get'])
    def by_bounds(self, request):
        """
        GET /api/instalaciones/by_bounds/
        Obtener instalaciones dentro de un área rectangular
        Parámetros: south, west, north, east (coordenadas)
        """
        try:
            south = float(request.query_params.get('south'))
            west = float(request.query_params.get('west'))
            north = float(request.query_params.get('north'))
            east = float(request.query_params.get('east'))
            tipo = request.query_params.get('tipo')
            search = request.query_params.get('search')
            categorias = request.query_params.get('categorias')
            
            # Construir filtro base (bounds)
            filtro = {
                'latitud': {'$gte': south, '$lte': north},
                'longitud': {'$gte': west, '$lte': east}
            }
            
            if search:
                filtro['$or'] = [
                    {'nombre': {'$regex': search, '$options': 'i'}},
                    {'direccion': {'$regex': search, '$options': 'i'}}
                ]
            
            # Lógica combinada de tipos + categorías
            aplicar_filtro_tipos_categorias(filtro, tipo, categorias)
            
            # Limitar a 500 resultados máximo
            instalaciones = list(self.collection.find(filtro).limit(500))
            
            # Convertir ObjectId a string
            for inst in instalaciones:
                inst['_id'] = str(inst['_id'])
            
            return Response({
                'count': len(instalaciones),
                'results': instalaciones,
                'limited': len(instalaciones) == 500
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    @action(detail=False, methods=['get'], url_path='eliminadas')
    def eliminadas(self, request):
        """
        GET /api/instalaciones/eliminadas/
        Lista instalaciones eliminadas (backup)
        Requiere autenticación
        """
        eliminados_collection = self.db['instalaciones_eliminadas']
        
        # Paginación
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size
        
        total_count = eliminados_collection.count_documents({})
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
        
        cursor = eliminados_collection.find({}).sort('fecha_eliminacion', -1).skip(skip).limit(page_size)
        resultados = list(cursor)
        
        for resultado in resultados:
            resultado['_id'] = str(resultado['_id'])
            # Convertir datetime a string para JSON
            if 'fecha_eliminacion' in resultado and isinstance(resultado['fecha_eliminacion'], datetime):
                resultado['fecha_eliminacion'] = resultado['fecha_eliminacion'].isoformat()
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'results': resultados
        })
    
    @action(detail=False, methods=['post'], url_path='eliminadas/(?P<eliminada_id>[^/.]+)/restaurar')
    def restaurar(self, request, eliminada_id=None):
        """
        POST /api/instalaciones/eliminadas/{id}/restaurar/
        Restaura una instalación eliminada
        Requiere autenticación
        """
        try:
            eliminados_collection = self.db['instalaciones_eliminadas']
            obj_id = ObjectId(eliminada_id)
            
            # Buscar en eliminadas
            eliminada = eliminados_collection.find_one({'_id': obj_id})
            
            if not eliminada:
                return Response(
                    {'error': 'Instalación eliminada no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Preparar datos para restaurar (quitar campos de eliminación)
            datos_restaurar = {k: v for k, v in eliminada.items() 
                             if k not in ['_id', 'eliminado_por', 'eliminado_por_id', 
                                         'fecha_eliminacion', 'razon', 'instalacion_id_original']}
            
            # Añadir metadata de restauración
            datos_restaurar['restaurado_por'] = request.user.username
            datos_restaurar['fecha_restauracion'] = datetime.now()
            
            # Insertar de vuelta en instalaciones
            result = self.collection.insert_one(datos_restaurar)
            
            # Eliminar de la colección de eliminadas
            eliminados_collection.delete_one({'_id': obj_id})
            
            # Recuperar el documento restaurado
            restaurada = self.collection.find_one({'_id': result.inserted_id})
            restaurada['_id'] = str(restaurada['_id'])
            
            return Response({
                'message': 'Instalación restaurada correctamente',
                'instalacion': restaurada
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )