#!/usr/bin/env python3
"""
Script para explorar qué hay en MongoDB
"""

from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Conectar a MongoDB
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)

print("=" * 80)
print("  EXPLORANDO MONGODB")
print("=" * 80)

# Listar todas las bases de datos
print("\n📦 BASES DE DATOS DISPONIBLES:")
print("-" * 80)
for db_name in client.list_database_names():
    print(f"  • {db_name}")

# Intentar con la base de datos que creemos que es
db = client['instalaciones_deportivas']

# Listar colecciones
print(f"\n📂 COLECCIONES EN 'instalaciones_deportivas':")
print("-" * 80)
collections = db.list_collection_names()
if collections:
    for coll_name in collections:
        count = db[coll_name].count_documents({})
        print(f"  • {coll_name:30} {count:5} documentos")
else:
    print("  (vacía)")

# Probar con otras posibles bases de datos
print(f"\n🔍 EXPLORANDO OTRAS BASES DE DATOS:")
print("-" * 80)
for db_name in client.list_database_names():
    if db_name not in ['admin', 'local', 'config']:
        db_test = client[db_name]
        collections_test = db_test.list_collection_names()
        if collections_test:
            print(f"\n  Base de datos: {db_name}")
            for coll_name in collections_test:
                count = db_test[coll_name].count_documents({})
                print(f"    • {coll_name:30} {count:5} documentos")

print("\n" + "=" * 80)
print("✅ Exploración completada")
print("=" * 80)

client.close()