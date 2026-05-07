#!/usr/bin/env python3
"""
Script para crear índices en MongoDB
Esto mejorará MUCHO el rendimiento de las queries
"""

from pymongo import MongoClient, ASCENDING, GEOSPHERE
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['instalaciones_cv']
collection = db['instalaciones']

print("=" * 80)
print("  CREANDO ÍNDICES EN MONGODB")
print("=" * 80)

# 1. Índice geoespacial para búsquedas por bounds (MUY IMPORTANTE)
print("\n📍 Creando índice geoespacial...")
collection.create_index([
    ("latitud", ASCENDING),
    ("longitud", ASCENDING)
])
print("✅ Índice geoespacial creado")

# 2. Índice por tipo (para filtrar público/privado/tienda/camping)
print("\n🏷️  Creando índice por tipo...")
collection.create_index([("tipo", ASCENDING)])
print("✅ Índice por tipo creado")

# 3. Índice por categorías (para filtros de categorías)
print("\n📂 Creando índice por categorías...")
collection.create_index([("categorias", ASCENDING)])
print("✅ Índice por categorías creado")

# 4. Índice compuesto para queries complejas
print("\n🔗 Creando índice compuesto (tipo + coords)...")
collection.create_index([
    ("tipo", ASCENDING),
    ("latitud", ASCENDING),
    ("longitud", ASCENDING)
])
print("✅ Índice compuesto creado")

# 5. Índice de texto para búsquedas
print("\n🔍 Creando índice de texto para búsquedas...")
collection.create_index([
    ("nombre", "text"),
    ("direccion", "text")
])
print("✅ Índice de texto creado")

# Listar todos los índices
print("\n" + "=" * 80)
print("📋 ÍNDICES ACTUALES:")
print("=" * 80)
for idx in collection.list_indexes():
    print(f"  • {idx['name']}")

print("\n" + "=" * 80)
print("✅ ¡ÍNDICES CREADOS! Las queries ahora serán mucho más rápidas")
print("=" * 80)

client.close()