import csv
from pathlib import Path
from pymongo import MongoClient
from decouple import config
import sys
import os

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from api.utils import normalizar_categorias_privadas

MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

DATA_DIR = BASE_DIR.parent / 'data_local'
csv_path = DATA_DIR / 'instalaciones_privadas_elche.csv'

print("=" * 80)
print("  RASTREO COMPLETO: CSV → MongoDB (DANZA)")
print("=" * 80)

# Leer CSV
nombres_csv_danza = []
with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if 'danza' in row.get('categoria', '').lower():
            nombres_csv_danza.append(row['nombre'])

print(f"\n1️⃣ CSV: {len(nombres_csv_danza)} con categoría 'danza'")

# Simular normalización
categorias_normalizadas = []
for nombre in nombres_csv_danza:
    cats = normalizar_categorias_privadas('danza')
    categorias_normalizadas.append(cats)

print(f"2️⃣ Normalización: {len([c for c in categorias_normalizadas if 'Danza' in c])} convertidas a 'Danza'")

# Verificar en MongoDB - instalaciones privadas de Elche
mongo_todas_privadas_elx = collection.count_documents({
    'tipo': 'privado',
    'denom_municipio': 'Elx'
})

print(f"\n3️⃣ MongoDB: {mongo_todas_privadas_elx} instalaciones privadas en Elx")

# Verificar con categoría Danza
mongo_danza_elx = collection.count_documents({
    'tipo': 'privado',
    'denom_municipio': 'Elx',
    'categorias': 'Danza'  # Búsqueda exacta
})

print(f"4️⃣ MongoDB: {mongo_danza_elx} con categoría exacta 'Danza'")

# Verificar con regex
mongo_danza_regex = collection.count_documents({
    'tipo': 'privado',
    'denom_municipio': 'Elx',
    'categorias': {'$regex': 'Danza', '$options': 'i'}
})

print(f"5️⃣ MongoDB: {mongo_danza_regex} con categoría regex 'Danza'")

# Listar todos los nombres en MongoDB
print(f"\n📋 NOMBRES EN MONGODB (primeros 10):")
cursor = collection.find({
    'tipo': 'privado',
    'denom_municipio': 'Elx',
    'categorias': 'Danza'
}).limit(10)

for doc in cursor:
    print(f"   • {doc['nombre']}")

# Comparar nombres
print(f"\n" + "=" * 80)
print("  COMPARACIÓN DE NOMBRES")
print("=" * 80)

nombres_mongo = set()
cursor = collection.find({
    'tipo': 'privado',
    'denom_municipio': 'Elx',
    'categorias': 'Danza'
})

for doc in cursor:
    nombres_mongo.add(doc['nombre'])

nombres_csv_set = set(nombres_csv_danza)

faltantes = nombres_csv_set - nombres_mongo

print(f"\n❌ EN CSV PERO NO EN MONGODB ({len(faltantes)}):")
for i, nombre in enumerate(list(faltantes)[:10], 1):
    print(f"   {i}. {nombre}")

if len(faltantes) > 10:
    print(f"   ... y {len(faltantes) - 10} más")
    