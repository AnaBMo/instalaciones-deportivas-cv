from pymongo import MongoClient
from decouple import config

MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

print("="*80)
print("  ANÁLISIS DETALLADO DE DATOS")
print("="*80)

# 1. Instalaciones con categorías vacías
vacias_total = collection.count_documents({'categorias': []})
vacias_publicas = collection.count_documents({'tipo': 'publico', 'categorias': []})
vacias_privadas = collection.count_documents({'tipo': 'privado', 'categorias': []})

print(f"\n⚠️  INSTALACIONES CON CATEGORÍAS VACÍAS:")
print(f"   Total: {vacias_total}")
print(f"   - Públicas: {vacias_publicas}")
print(f"   - Privadas: {vacias_privadas}")

# 2. Ejemplos de públicas con categorías vacías
print(f"\n📋 EJEMPLOS PÚBLICAS con categorías vacías (10 primeros):")
for doc in collection.find({'tipo': 'publico', 'categorias': []}).limit(10):
    nombre = doc.get('nombre', 'Sin nombre')
    deportes = doc.get('deportes_raw', '')[:60]
    print(f"   • {nombre}")
    print(f"     deportes_raw: '{deportes}'")

# 3. Todas las categorías únicas que SÍ existen
print(f"\n🏷️  CATEGORÍAS ÚNICAS ENCONTRADAS:")
pipeline_cats = [
    {'$match': {'categorias': {'$ne': []}}},
    {'$unwind': '$categorias'},
    {'$group': {'_id': '$categorias', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 30}
]
for item in collection.aggregate(pipeline_cats):
    print(f"   • {item['_id']}: {item['count']}")

print("\n" + "="*80)