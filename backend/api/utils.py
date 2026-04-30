"""
Utilidades para normalización de datos
"""
from .catalogos import DEPORTES_OFICIALES, ACTIVIDADES_OFICIALES
import re


def normalizar_deportes_publicas(deportes_raw):
    """
    Convierte códigos deportivos oficiales a lista normalizada
    
    Input: " M:25 E:160 A: &  M:25 E:159 A:343"
    Output: ["Fútbol sala", "Balonmano", "Baloncesto", "Aquagym"]
    """
    if not deportes_raw:
        return []
    
    deportes = set()
    
    # Buscar todos los códigos en el formato "letra:número"
    # Ejemplo: E:160, M:25, A:343
    patron = r'[A-Z]:(\d+)'
    codigos_encontrados = re.findall(patron, deportes_raw)
    
    for codigo in codigos_encontrados:
        # Buscar en deportes
        if codigo in DEPORTES_OFICIALES:
            nombre = DEPORTES_OFICIALES[codigo].strip()  
            deportes.add(nombre)
        # Buscar en actividades
        elif codigo in ACTIVIDADES_OFICIALES:
            nombre = ACTIVIDADES_OFICIALES[codigo].strip()  
            deportes.add(nombre)
    
    return sorted(list(deportes))


def normalizar_categorias_privadas(categoria):
    """
    Convierte categoría de Google Places a lista normalizada
    
    Input: "artes_marciales" o "artes_marciales,fitness"
    Output: ["Artes Marciales", "Fitness"]
    """
    if not categoria:
        return []
    
    # Mapeo de categorías privadas a nombres amigables
    MAPEO_PRIVADAS = {
        'artes_marciales': 'Artes Marciales',
        'danza': 'Danza',
        'deportes_generales': 'Deportes Generales',
        'equitacion': 'Equitación',
        'escalada': 'Escalada',
        'fitness': 'Fitness',
        'golf': 'Golf',
        'padel_tenis': 'Pádel y Tenis',
        'piscinas': 'Natación',
        'skating': 'Skating',
        'yoga': 'Yoga',
        'pilates': 'Pilates',
        'crossfit': 'CrossFit',
        'boxeo': 'Boxeo',
        'gimnasio': 'Gimnasio',
        'tienda_deportiva': 'Tienda Deportiva',
        'tienda_running': 'Tienda Running',
        'tienda_ciclismo': 'Tienda Ciclismo',
        'camping': 'Camping',
    }
    
    categorias = []
    
    # Separar por comas si existen
    cats = [c.strip() for c in categoria.split(',')]
    
    for cat in cats:
        # Normalizar a nombre amigable
        nombre = MAPEO_PRIVADAS.get(cat.lower(), cat.title())
        categorias.append(nombre)
    
    return categorias