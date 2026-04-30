"""
Script para importar datos a MongoDB
Importa instalaciones públicas (JSON) + privadas/tiendas/campings (CSVs)
"""
import os
import sys
import json
import csv
from pathlib import Path
from pymongo import MongoClient
from decouple import config

# Configurar path para importar desde Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Importar utilidades de normalización
from api.utils import normalizar_deportes_publicas, normalizar_categorias_privadas

# Conectar a MongoDB
MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

# Rutas de datos
DATA_DIR = BASE_DIR.parent / 'data_local'


def limpiar_coleccion():
    """Elimina todos los datos existentes"""
    count = collection.count_documents({})
    if count > 0:
        print(f"⚠️  Existen {count} documentos en la colección")
        respuesta = input("¿Eliminar todos los datos existentes? (s/n): ")
        if respuesta.lower() == 's':
            collection.delete_many({})
            print("✅ Colección limpiada")
        else:
            print("❌ Importación cancelada")
            sys.exit(0)


def inferir_categorias_del_nombre(nombre):
    """
    Intenta inferir categorías del nombre cuando deportes_raw está vacío
    """
    nombre_lower = nombre.lower()
    
    # Diccionario de palabras clave → categorías (PRIMERO definirlo)
    PALABRAS_CLAVE = {
        # Danza y baile
        'danza': ['Danza'],
        'ballet': ['Danza'],
        'baile': ['Danza'],
        'coreograf': ['Danza'],
        
        # Gimnasia
        'gimnasia rítmica': ['Gimnasia Rítmica'],
        'gimnasia artística': ['Gimnasia Artística'],
        'gimnasia': ['Gimnasia'],
        'gimnasio': ['Fitness'],
        
        # Artes marciales
        'karate': ['Artes Marciales'],
        'judo': ['Artes Marciales'],
        'taekwondo': ['Artes Marciales'],
        'aikido': ['Artes Marciales'],
        'kung fu': ['Artes Marciales'],
        'artes marciales': ['Artes Marciales'],
        'boxeo': ['Artes Marciales'],
        'kickboxing': ['Artes Marciales'],
        
        # Deportes de raqueta
        'tenis': ['Tenis'],
        'pádel': ['Pádel y Tenis'],
        'padel': ['Pádel y Tenis'],
        'bádminton': ['Bádminton'],
        'squash': ['Squash'],
        
        # Natación y deportes acuáticos
        'natación': ['Natación'],
        'piscina': ['Natación'],
        'aquagym': ['Aquagym'],
        'waterpolo': ['Waterpolo'],
        'club nautico': ['Deportes Náuticos'],
        'club náutico': ['Deportes Náuticos'],
        'nautico': ['Deportes Náuticos'],
        'náutico': ['Deportes Náuticos'],
        'regatas': ['Deportes Náuticos'],
        'vela': ['Deportes Náuticos'],
        'piragüismo': ['Deportes Náuticos'],
        'remo': ['Deportes Náuticos'],
        
        # Deportes de equipo
        'fútbol': ['Fútbol'],
        'futbol': ['Fútbol'],
        'baloncesto': ['Baloncesto'],
        'balonmano': ['Balonmano'],
        'voleibol': ['Voleibol'],
        'voley': ['Voleibol'],
        'rugby': ['Rugby'],
        'hockey': ['Hockey'],
        
        # Atletismo
        'atletismo': ['Atletismo'],
        'atletico': ['Atletismo'],
        'atlético': ['Atletismo'],
        'running': ['Atletismo'],
        'cross': ['Atletismo'],
        
        # Otros deportes tradicionales
        'petanca': ['Petanca'],
        'frontón': ['Frontón'],
        'fronton': ['Frontón'],
        'pelota': ['Pelota Valenciana'],
        'pilota': ['Pelota Valenciana'],
        
        # Tiro
        'tiro con arco': ['Tiro con Arco'],
        'tiro olimpico': ['Tiro Olímpico'],
        'tiro olímpico': ['Tiro Olímpico'],
        
        # Otros deportes
        'escalada': ['Escalada'],
        'yoga': ['Yoga'],
        'pilates': ['Pilates'],
        'equitación': ['Equitación'],
        'hípica': ['Equitación'],
        'golf': ['Golf'],
        'esgrima': ['Esgrima'],
        'ciclismo': ['Ciclismo'],
        'patinaje': ['Patinaje'],
        'skate': ['Skating'],
        'crossfit': ['Fitness'],
        
        # Instalaciones específicas
        'estadio': ['Deportes Generales'],
        'pabellon': ['Deportes Generales'],
        'pabellón': ['Deportes Generales'],
        'campo de futbol': ['Fútbol'],
        'campo de fútbol': ['Fútbol'],

        # Genéricos - IMPORTANTE: al final para no sobrescribir específicos
        'polideportivo': ['Deportes Generales'],
        'club deportivo': ['Deportes Generales'],
        'centro deportivo': ['Deportes Generales'],
        'ciudad deportiva': ['Deportes Generales'],
        'complejo deportivo': ['Deportes Generales'],
        'instalacion deportiva': ['Deportes Generales'],
        'instalación deportiva': ['Deportes Generales'],
    }
    
    # Verificar si es un colegio/escuela
    palabras_colegio = ['c.p.', 'c. p.', 'c p ', 'c.pub', 'c. pub', 'c pub', 
                            'colegio', 'ceip', 'c.e.i.p', 'escuela', 'instituto', 
                            'ies', 'i.e.s.', 'i.e.s', 'i.b.', 'i.b', 
                            'primaria', 'infantil', 'secundaria']
    
    es_colegio = any(palabra in nombre_lower for palabra in palabras_colegio)
    
    if es_colegio:
        # Si es colegio PERO tiene deporte específico, usar ese
        # Ej: "COLEGIO GIMNASIA RITMICA" → ["Gimnasia Rítmica"]
        for palabra_clave, categorias in PALABRAS_CLAVE.items():
            if palabra_clave in nombre_lower:
                return categorias
        # Si no tiene deporte específico → Educación Física
        return ['Educación Física']
    
    # Para no-colegios: buscar deportes específicos
    for palabra_clave, categorias in PALABRAS_CLAVE.items():
        if palabra_clave in nombre_lower:
            return categorias
    
    return []


def importar_publicas():
    """Importa instalaciones públicas desde JSON oficial"""
    print("\n" + "="*80)
    print("  IMPORTANDO INSTALACIONES PÚBLICAS")
    print("="*80)
    
    json_path = DATA_DIR / 'a-instalaciones-deportivas-publicas.json'
    
    if not json_path.exists():
        print(f"❌ No se encontró: {json_path}")
        return 0
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📖 Leyendo {len(data)} instalaciones del JSON...")
    
    documentos = []
    errores = 0
    categorias_inferidas = 0
    categorias_aun_vacias = 0
    
    for item in data:
        try:
            lat = item.get('LATITUD')
            lng = item.get('LONGITUD')
            
            if not lat or not lng:
                errores += 1
                continue
            
            try:
                lat = float(lat)
                lng = float(lng)
            except:
                errores += 1
                continue
            
            # Normalizar deportes desde códigos
            deportes_raw = item.get('DEPORTES', '')
            categorias = normalizar_deportes_publicas(deportes_raw)
            
            # Si categorías está vacío, intentar inferir del nombre
            if not categorias:
                nombre = item.get('NOMBRE', '')
                categorias_inferidas_item = inferir_categorias_del_nombre(nombre)
                if categorias_inferidas_item:
                    categorias = categorias_inferidas_item
                    categorias_inferidas += 1
                else:
                    # Si aún está vacío, asignar "Sin Categoría"
                    categorias = ['Sin Categoría']
                    categorias_aun_vacias += 1
            
            documento = {
                'codigo': item.get('CODIGO'),
                'nombre': item.get('NOMBRE', 'Sin nombre'),
                'direccion': item.get('DIRECCION', ''),
                'latitud': lat,
                'longitud': lng,
                'cod_postal': item.get('COD_POSTAL'),
                'cod_provincia': item.get('COD_PROVINCIA'),
                'denom_provincia': item.get('DENOM_PROVINCIA'),
                'cod_municipio': item.get('COD_MUNICIPIO'),
                'denom_municipio': item.get('DENOM_MUNICIPIO'),
                'tipo': 'publico',
                'categorias': categorias,
                'deportes_raw': deportes_raw,
                'telefono': item.get('TELEFONO'),
                'email': item.get('EMAIL'),
                'url': item.get('URL'),
                'anyo_inicio': item.get('ANYO_INICIO'),
            }
            
            documentos.append(documento)
            
        except Exception as e:
            errores += 1
    
    if documentos:
        collection.insert_many(documentos)
        print(f"✅ Importadas {len(documentos)} instalaciones públicas")
        print(f"⚠️  Errores: {errores}")
        print(f"🔍 Categorías inferidas del nombre: {categorias_inferidas}")
        print(f"⚠️  Aún sin categoría: {categorias_aun_vacias}")
    
    return len(documentos)


def importar_privadas():
    """Importa instalaciones privadas desde CSVs"""
    print("\n" + "="*80)
    print("  IMPORTANDO INSTALACIONES PRIVADAS")
    print("="*80)
    
    csvs_privadas = list(DATA_DIR.glob('instalaciones_privadas_*.csv'))
    
    if not csvs_privadas:
        print("⚠️  No se encontraron CSVs de instalaciones privadas")
        return 0
    
    total_importadas = 0
    
    for csv_path in csvs_privadas:
        print(f"\n📖 Procesando: {csv_path.name}")
        
        with open(csv_path, 'r', encoding='utf-8-sig') as f:  # ← Cambiado a utf-8-sig
            reader = csv.DictReader(f)
            documentos = []
            errores = 0
            
            for row in reader:
                try:
                    lat = row.get('latitud')
                    lng = row.get('longitud')
                    
                    if not lat or not lng or lat == '' or lng == '':
                        errores += 1
                        continue
                    
                    lat = float(lat)
                    lng = float(lng)
                    
                    categoria_raw = row.get('categoria', '')
                    categorias = normalizar_categorias_privadas(categoria_raw)
                    
                    rating = row.get('rating')
                    if rating and rating != '':
                        try:
                            rating = float(rating)
                        except:
                            rating = None
                    else:
                        rating = None
                    
                    total_reviews = row.get('total_reviews')
                    if total_reviews and total_reviews != '':
                        try:
                            total_reviews = int(float(total_reviews))
                        except:
                            total_reviews = None
                    else:
                        total_reviews = None
                    
                    documento = {
                        'nombre': row.get('nombre', 'Sin nombre'),
                        'direccion': row.get('direccion', ''),
                        'latitud': lat,
                        'longitud': lng,
                        'tipo': 'privado',
                        'categorias': categorias,
                        'deportes_raw': None,
                        'rating': rating,
                        'total_reviews': total_reviews,
                        'place_id': row.get('place_id'),
                        'tipos_google': row.get('tipos'),
                        'denom_municipio': extraer_municipio(row.get('direccion', '')),
                        'denom_provincia': 'ALICANTE',
                    }
                    
                    documentos.append(documento)
                    
                except Exception as e:
                    errores += 1
            
            if documentos:
                collection.insert_many(documentos)
                print(f"   ✅ {len(documentos)} instalaciones")
                if errores > 0:
                    print(f"   ⚠️  Errores: {errores}")
                total_importadas += len(documentos)
    
    print(f"\n✅ Total privadas importadas: {total_importadas}")
    return total_importadas


def importar_tiendas():
    """Importa tiendas deportivas desde CSVs"""
    print("\n" + "="*80)
    print("  IMPORTANDO TIENDAS DEPORTIVAS")
    print("="*80)
    
    csvs_tiendas = list(DATA_DIR.glob('tiendas_*.csv'))
    
    if not csvs_tiendas:
        print("⚠️  No se encontraron CSVs de tiendas")
        return 0
    
    total_importadas = 0
    
    for csv_path in csvs_tiendas:
        print(f"\n📖 Procesando: {csv_path.name}")
        
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            documentos = []
            errores = 0
            
            for row in reader:
                try:
                    lat = float(row.get('latitud', row.get('lat', 0)))
                    lng = float(row.get('longitud', row.get('lng', 0)))
                    
                    if not lat or not lng:
                        errores += 1
                        continue
                    
                    rating = row.get('rating')
                    if rating and rating not in ['', 'null', 'None']:
                        try:
                            rating = float(rating)
                        except:
                            rating = None
                    else:
                        rating = None
                    
                    documento = {
                        'nombre': row.get('nombre', 'Sin nombre'),
                        'direccion': row.get('direccion', ''),
                        'latitud': lat,
                        'longitud': lng,
                        'tipo': 'tienda',
                        'categorias': [row.get('categoria', 'tienda_deportiva')],
                        'rating': rating,
                        'denom_municipio': extraer_municipio(row.get('direccion', '')),
                        'denom_provincia': 'ALICANTE',
                    }
                    
                    documentos.append(documento)
                except Exception as e:
                    errores += 1
            
            if documentos:
                collection.insert_many(documentos)
                print(f"   ✅ {len(documentos)} tiendas")
                if errores > 0:
                    print(f"   ⚠️  Errores: {errores}")
                total_importadas += len(documentos)
    
    print(f"\n✅ Total tiendas importadas: {total_importadas}")
    return total_importadas


def importar_campings():
    """Importa campings desde CSVs"""
    print("\n" + "="*80)
    print("  IMPORTANDO CAMPINGS")
    print("="*80)
    
    csvs_campings = list(DATA_DIR.glob('campings_*.csv'))
    
    if not csvs_campings:
        print("⚠️  No se encontraron CSVs de campings")
        return 0
    
    total_importadas = 0
    
    for csv_path in csvs_campings:
        print(f"\n📖 Procesando: {csv_path.name}")
        
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            documentos = []
            errores = 0
            
            for row in reader:
                try:
                    lat = float(row.get('latitud', row.get('lat', 0)))
                    lng = float(row.get('longitud', row.get('lng', 0)))
                    
                    if not lat or not lng:
                        errores += 1
                        continue
                    
                    rating = row.get('rating')
                    if rating and rating not in ['', 'null', 'None']:
                        try:
                            rating = float(rating)
                        except:
                            rating = None
                    else:
                        rating = None
                    
                    documento = {
                        'nombre': row.get('nombre', 'Sin nombre'),
                        'direccion': row.get('direccion', ''),
                        'latitud': lat,
                        'longitud': lng,
                        'tipo': 'camping',
                        'categorias': [row.get('categoria', 'camping')],
                        'rating': rating,
                        'denom_municipio': extraer_municipio(row.get('direccion', '')),
                        'denom_provincia': 'ALICANTE',
                    }
                    
                    documentos.append(documento)
                except Exception as e:
                    errores += 1
            
            if documentos:
                collection.insert_many(documentos)
                print(f"   ✅ {len(documentos)} campings")
                if errores > 0:
                    print(f"   ⚠️  Errores: {errores}")
                total_importadas += len(documentos)
    
    print(f"\n✅ Total campings importados: {total_importadas}")
    return total_importadas


def extraer_municipio(direccion):
    """Intenta extraer el municipio de la dirección"""
    municipios_conocidos = [
        'Alicante', 'Elche', 'Elx', 'Sant Vicent del Raspeig', 
        'Sant Joan d\'Alacant', 'San Fulgencio', 'Santa Pola',
        'Finestrat', 'Gandia', 'Ondara', 'Cocentaina',
        'Crevillent', 'Novelda', 'Torrevieja'
    ]
    
    for municipio in municipios_conocidos:
        if municipio.lower() in direccion.lower():
            return municipio
    
    return None


def mostrar_estadisticas():
    """Muestra estadísticas de los datos importados"""
    print("\n" + "="*80)
    print("  ESTADÍSTICAS DE IMPORTACIÓN")
    print("="*80)
    
    total = collection.count_documents({})
    publicas = collection.count_documents({'tipo': 'publico'})
    privadas = collection.count_documents({'tipo': 'privado'})
    tiendas = collection.count_documents({'tipo': 'tienda'})
    campings = collection.count_documents({'tipo': 'camping'})
    
    print(f"\n📊 TOTAL: {total} instalaciones")
    print(f"   🏛️  Públicas:  {publicas}")
    print(f"   🏢 Privadas:  {privadas}")
    print(f"   🛒 Tiendas:   {tiendas}")
    print(f"   🏕️  Campings:  {campings}")
    
    # Por provincia
    print(f"\n📍 POR PROVINCIA:")
    pipeline = [
        {'$group': {'_id': '$denom_provincia', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    for item in collection.aggregate(pipeline):
        if item['_id']:
            print(f"   • {item['_id']}: {item['count']}")
    
    # Top municipios
    print(f"\n🏙️  TOP 10 MUNICIPIOS:")
    pipeline = [
        {'$group': {'_id': '$denom_municipio', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
        {'$limit': 10}
    ]
    for item in collection.aggregate(pipeline):
        if item['_id']:
            print(f"   • {item['_id']}: {item['count']}")


def verificacion_final(publicas, privadas, tiendas, campings):
    """Verificación cruzada con MongoDB"""
    print("\n" + "="*80)
    print("  🔍 VERIFICACIÓN FINAL")
    print("="*80)
    
    total_importado = publicas + privadas + tiendas + campings
    total_mongo = collection.count_documents({})
    
    print(f"\n📊 RESUMEN DE IMPORTACIÓN:")
    print(f"   Públicas:  {publicas:>6}")
    print(f"   Privadas:  {privadas:>6}")
    print(f"   Tiendas:   {tiendas:>6}")
    print(f"   Campings:  {campings:>6}")
    print(f"   " + "-" * 20)
    print(f"   TOTAL:     {total_importado:>6}")
    
    print(f"\n📊 EN MONGODB:")
    print(f"   Documentos: {total_mongo:>6}")
    
    if total_importado == total_mongo:
        print(f"\n✅ PERFECTO: {total_importado} importados == {total_mongo} en MongoDB")
    else:
        diferencia = abs(total_importado - total_mongo)
        print(f"\n⚠️  ADVERTENCIA: Diferencia de {diferencia} registros")


def main():
    print("="*80)
    print("  IMPORTACIÓN DE DATOS A MONGODB")
    print("="*80)
    
    limpiar_coleccion()
    
    total_publicas = importar_publicas()
    total_privadas = importar_privadas()
    total_tiendas = importar_tiendas()
    total_campings = importar_campings()
    
    mostrar_estadisticas()
    verificacion_final(total_publicas, total_privadas, total_tiendas, total_campings)
    
    print("\n" + "="*80)
    print("  ✨ IMPORTACIÓN COMPLETADA")
    print("="*80)
    print(f"\n🌐 Ahora puedes acceder a los datos en:")
    print(f"   • API: http://127.0.0.1:8000/api/instalaciones/")
    print(f"   • Stats: http://127.0.0.1:8000/api/instalaciones/stats/")
    print(f"\n📝 Asegúrate de que Django esté corriendo:")
    print(f"   python manage.py runserver")


if __name__ == "__main__":
    main()