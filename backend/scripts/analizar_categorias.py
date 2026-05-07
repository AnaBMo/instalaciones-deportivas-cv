#!/usr/bin/env python3
"""
Script para analizar categorías en MongoDB
"""

from pymongo import MongoClient
from collections import Counter
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Conectar a MongoDB
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['instalaciones_cv']
collection = db['instalaciones']

print("=" * 80)
print("  ANÁLISIS DE CATEGORÍAS EN MONGODB")
print("=" * 80)

# Obtener todas las instalaciones
instalaciones = list(collection.find({}))

print(f"\n📊 Total de instalaciones en MongoDB: {len(instalaciones)}")

# Analizar por tipo
tipos = Counter([inst.get('tipo', 'sin_tipo') for inst in instalaciones])
print(f"\n📌 INSTALACIONES POR TIPO:")
print("-" * 80)
for tipo, count in tipos.most_common():
    print(f"  • {tipo:20} {count:5}")

# Analizar categorías de PRIVADAS
print(f"\n🏢 CATEGORÍAS DE INSTALACIONES PRIVADAS:")
print("-" * 80)
categorias_privadas = []
for inst in instalaciones:
    if inst.get('tipo') == 'privado':
        cats = inst.get('categorias', [])
        if isinstance(cats, list):
            categorias_privadas.extend(cats)
        elif isinstance(cats, str):
            categorias_privadas.extend([c.strip() for c in cats.split(',')])

counter_privadas = Counter(categorias_privadas)
if counter_privadas:
    for cat, count in counter_privadas.most_common():
        print(f"  • {cat:30} {count:5}")
else:
    print("  (No hay categorías)")

# Analizar categorías de TIENDAS
print(f"\n🛒 CATEGORÍAS DE TIENDAS:")
print("-" * 80)
categorias_tiendas = []
for inst in instalaciones:
    if inst.get('tipo') == 'tienda':
        cats = inst.get('categorias', [])
        if isinstance(cats, list):
            categorias_tiendas.extend(cats)
        elif isinstance(cats, str):
            categorias_tiendas.extend([c.strip() for c in cats.split(',')])

counter_tiendas = Counter(categorias_tiendas)
if counter_tiendas:
    for cat, count in counter_tiendas.most_common():
        print(f"  • {cat:30} {count:5}")
else:
    print("  (No hay categorías)")

# Analizar por provincia
print(f"\n🏙️ INSTALACIONES POR PROVINCIA:")
print("-" * 80)
provincias = Counter([inst.get('denom_provincia', 'sin_provincia') for inst in instalaciones])
for prov, count in provincias.most_common():
    prov_str = str(prov) if prov else 'Sin provincia'
    print(f"  • {prov_str:20} {count:5}")

# Analizar municipios con más instalaciones (Top 10)
print(f"\n🏘️ TOP 10 MUNICIPIOS:")
print("-" * 80)
municipios = Counter([inst.get('denom_municipio', 'Sin municipio') for inst in instalaciones])
for mun, count in municipios.most_common(10):
    mun_str = str(mun) if mun else 'Sin municipio'
    print(f"  • {mun_str:30} {count:5}")

print("\n" + "=" * 80)
print("✅ Análisis completado")
print("=" * 80)

client.close()