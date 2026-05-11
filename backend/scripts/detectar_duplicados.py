#!/usr/bin/env python3
"""
Detectar y eliminar DUPLICADOS REALES en MongoDB - V3
Solo elimina cuando:
  1. Las coordenadas están a menos de 50 metros
  2. Los nombres son muy similares (ignorando palabras genéricas)
  3. Son del mismo tipo
"""

from pymongo import MongoClient
from decouple import config
from math import radians, sin, cos, sqrt, atan2
import re

MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

# Palabras genéricas que NO cuentan para la similitud
# porque aparecen en muchas instalaciones diferentes
STOPWORDS = {
    # Tipos de instalación
    'municipal', 'municipales', 'mpal', 'muni',
    'polideportivo', 'poliesportiu', 'polideportiu', 'polisesportiu',
    'piscina', 'piscinas', 'piscines', 'coberta', 'cubierta', 'descubierta', 'descoberta',
    'campo', 'camp', 'campos',
    'pabellon', 'pavello', 'pavelló', 'pabellón',
    'gimnasio', 'gimnas', 'gimnàs',
    'polideportivo', 'deportivo', 'deportiva', 'esportiu', 'esportiva',
    'fronton', 'frontón', 'frontenis', 'fronto', 'frontó',
    'pista', 'pistas', 'pistes',
    'centro', 'centre',
    'complejo', 'complex',
    'instalaciones', 'instal·lacions',
    'club', 'skate', 'park', 'skatepark',
    'padel', 'pádel', 'paddle', 'tenis', 'tennis',
    'futbol', 'fútbol', 'futbito', 'futbol sala',
    'petanca', 'trinquet', 'trinquete',
    'calistenia', 'calistènia',
    'zona', 'area', 'área', 'recinto',
    'verano', 'estiu',
    # Artículos y preposiciones
    'de', 'del', 'la', 'el', 'los', 'las', 'les', 'en', 'a', 'y', 'i', 'e',
    'd', 'l', 's',
    # Otros genéricos
    'nuevo', 'nueva', 'nou', 'nova',
    'publico', 'publica', 'público', 'pública',
    'ide', 'cpb', 'cp', 'ies', 'ceip', 'pub', 'colegio', 'escuela',
}


def calcular_distancia(lat1, lon1, lat2, lon2):
    """Distancia en metros entre dos coordenadas"""
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c


def normalizar_nombre(nombre):
    """Normaliza un nombre para comparación"""
    nombre = nombre.lower().strip()
    nombre = re.sub(r'[·\-\(\)\"\'\,\.\/\:\;\!\¿\?\✅\→]', ' ', nombre)
    nombre = re.sub(r'\s+', ' ', nombre).strip()
    return nombre


def palabras_significativas(nombre):
    """Extrae solo las palabras significativas (no genéricas)"""
    nombre = normalizar_nombre(nombre)
    palabras = nombre.split()
    significativas = [p for p in palabras if p not in STOPWORDS and len(p) > 1]
    return set(significativas)


def similitud_nombres(nombre1, nombre2):
    """
    Calcula similitud entre dos nombres usando solo palabras significativas.
    Si ambos nombres solo tienen palabras genéricas, retorna 0 (no son duplicados).
    """
    # Primero: si los nombres normalizados son idénticos, es duplicado seguro
    n1 = normalizar_nombre(nombre1)
    n2 = normalizar_nombre(nombre2)
    if n1 == n2:
        return 1.0

    sig1 = palabras_significativas(nombre1)
    sig2 = palabras_significativas(nombre2)

    # Si alguno no tiene palabras significativas, no podemos comparar
    # (ej: "PISCINA MUNICIPAL" vs "FRONTÓN MUNICIPAL")
    if not sig1 or not sig2:
        return 0.0

    comunes = sig1 & sig2
    total = max(len(sig1), len(sig2))

    if total == 0:
        return 0.0

    return len(comunes) / total


def detectar_duplicados(distancia_maxima=50, similitud_minima=0.6):
    """
    Detecta duplicados REALES: coordenadas cercanas + nombres similares + mismo tipo
    """
    print("=" * 80)
    print("  DETECCIÓN DE DUPLICADOS REALES EN MONGODB - V3")
    print(f"  Criterios: distancia < {distancia_maxima}m + similitud nombre > {similitud_minima*100}%")
    print(f"  (ignorando palabras genéricas: municipal, piscina, campo, etc.)")
    print("=" * 80)

    todas = list(collection.find(
        {'latitud': {'$exists': True}, 'longitud': {'$exists': True}},
        {'nombre': 1, 'direccion': 1, 'tipo': 1, 'latitud': 1, 'longitud': 1,
         'rating': 1, 'categorias': 1}
    ))

    print(f"\n📊 Total instalaciones: {len(todas)}")

    procesados = set()
    grupos_duplicados = []

    for i, inst1 in enumerate(todas):
        if str(inst1['_id']) in procesados:
            continue

        grupo = [inst1]
        procesados.add(str(inst1['_id']))

        for j, inst2 in enumerate(todas):
            if i >= j or str(inst2['_id']) in procesados:
                continue

            if inst1.get('tipo') != inst2.get('tipo'):
                continue

            try:
                distancia = calcular_distancia(
                    float(inst1['latitud']), float(inst1['longitud']),
                    float(inst2['latitud']), float(inst2['longitud'])
                )
            except (ValueError, TypeError):
                continue

            if distancia >= distancia_maxima:
                continue

            sim = similitud_nombres(inst1.get('nombre', ''), inst2.get('nombre', ''))

            if sim >= similitud_minima:
                grupo.append(inst2)
                procesados.add(str(inst2['_id']))

        if len(grupo) > 1:
            grupos_duplicados.append(grupo)

    total_duplicados = sum(len(g) - 1 for g in grupos_duplicados)

    print(f"\n🔍 RESULTADOS:")
    print(f"   Grupos de duplicados: {len(grupos_duplicados)}")
    print(f"   Instalaciones a eliminar: {total_duplicados}")
    print(f"   Quedarían: {len(todas) - total_duplicados}")

    print(f"\n{'='*80}")
    print(f"  DETALLE DE DUPLICADOS")
    print(f"{'='*80}")

    for i, grupo in enumerate(grupos_duplicados, 1):
        print(f"\n--- Grupo {i} ({len(grupo)} instalaciones) ---")
        for j, inst in enumerate(grupo):
            rating = inst.get('rating', 'N/A')
            marca = "✅ CONSERVAR" if j == 0 else "❌ ELIMINAR"
            print(f"   {marca}: {inst['nombre']} (rating: {rating})")
            print(f"     Coords: {inst['latitud']}, {inst['longitud']} | Tipo: {inst.get('tipo')}")

    return grupos_duplicados


def eliminar_duplicados(grupos_duplicados, modo='dry_run'):
    """
    Elimina duplicados conservando el que tiene mejor rating.
    """
    print(f"\n{'='*80}")
    print(f"  {'SIMULACIÓN' if modo == 'dry_run' else 'EJECUCIÓN'} DE LIMPIEZA")
    print(f"{'='*80}")

    ids_a_eliminar = []

    for grupo in grupos_duplicados:
        def score(inst):
            rating = inst.get('rating')
            if rating is None or rating == '' or rating == 'N/A':
                return -1
            try:
                return float(rating)
            except (ValueError, TypeError):
                return -1

        grupo_ordenado = sorted(grupo, key=score, reverse=True)
        conservar = grupo_ordenado[0]
        eliminar = grupo_ordenado[1:]

        print(f"\n   ✅ CONSERVAR: {conservar['nombre']} (rating: {conservar.get('rating', 'N/A')})")
        for inst in eliminar:
            print(f"   ❌ ELIMINAR:  {inst['nombre']} (rating: {inst.get('rating', 'N/A')})")
            ids_a_eliminar.append(inst['_id'])

    print(f"\n📊 RESUMEN:")
    print(f"   Total a eliminar: {len(ids_a_eliminar)}")

    if modo == 'ejecutar' and ids_a_eliminar:
        resultado = collection.delete_many({'_id': {'$in': ids_a_eliminar}})
        print(f"\n   ✅ Eliminados: {resultado.deleted_count} documentos")
        print(f"   📊 Total restante: {collection.count_documents({})}")
    elif modo == 'dry_run':
        print(f"\n   ⚠️  Esto es una SIMULACIÓN.")

    return ids_a_eliminar


def main():
    grupos = detectar_duplicados(distancia_maxima=50, similitud_minima=0.9)

    if not grupos:
        print("\n✅ No se encontraron duplicados. ¡La base de datos está limpia!")
        return

    ids = eliminar_duplicados(grupos, modo='dry_run')

    if ids:
        respuesta = input(f"\n¿Eliminar {len(ids)} duplicados? (s/n): ")
        if respuesta.lower() == 's':
            eliminar_duplicados(grupos, modo='ejecutar')
            print("\n✅ ¡Limpieza completada!")
        else:
            print("\n❌ Cancelado. No se eliminó nada.")


if __name__ == "__main__":
    main()