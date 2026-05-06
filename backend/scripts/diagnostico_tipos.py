from pymongo import MongoClient
from decouple import config
from collections import Counter

client = MongoClient(config('MONGO_URI'))
db = client.get_database()
collection = db['instalaciones']

print("=" * 80)
print("  DIAGNÓSTICO DE TIPOS DE INSTALACIONES")
print("=" * 80)

# Contar por tipo
tipos = collection.distinct('tipo')
print(f"\n📊 TIPOS ENCONTRADOS: {tipos}")
print("\n" + "=" * 80)

for tipo in sorted(tipos):
    count = collection.count_documents({'tipo': tipo})
    print(f"  {tipo:20} {count:6} instalaciones")

print("\n" + "=" * 80)
print(f"  TOTAL: {collection.count_documents({})}")
print("=" * 80)

# Ver algunos ejemplos de cada tipo
print("\n📋 EJEMPLOS POR TIPO:")
print("=" * 80)
for tipo in sorted(tipos):
    ejemplos = list(collection.find({'tipo': tipo}).limit(3))
    print(f"\n🔹 {tipo.upper()}:")
    for ej in ejemplos:
        print(f"   • {ej.get('nombre', 'Sin nombre')}")