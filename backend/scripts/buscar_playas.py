from pymongo import MongoClient
from decouple import config

client = MongoClient(config('MONGO_URI'))
db = client.get_database()
collection = db['instalaciones']

print("=" * 80)
print("  BUSCANDO PLAYAS / BANDERAS AZULES")
print("=" * 80)

# Buscar por diferentes criterios
criterios = [
    {'nombre': {'$regex': 'playa', '$options': 'i'}},
    {'nombre': {'$regex': 'bandera', '$options': 'i'}},
    {'direccion': {'$regex': 'playa', '$options': 'i'}},
    {'categorias': {'$regex': 'playa', '$options': 'i'}},
]

total_playas = 0

for criterio in criterios:
    count = collection.count_documents(criterio)
    if count > 0:
        print(f"\n📊 Criterio: {criterio}")
        print(f"   Encontrados: {count}")
        total_playas = max(total_playas, count)
        
        # Mostrar ejemplos
        ejemplos = list(collection.find(criterio).limit(5))
        for ej in ejemplos:
            print(f"   • {ej.get('nombre', 'Sin nombre')} - Tipo: {ej.get('tipo', 'N/A')}")

print("\n" + "=" * 80)
print(f"  ESTIMACIÓN TOTAL DE PLAYAS: {total_playas}")
print("=" * 80)

# Ver si tienen un tipo específico
tipos_playas = collection.distinct('tipo', {'nombre': {'$regex': 'playa', '$options': 'i'}})
print(f"\n🏖️  Tipos de instalaciones con 'playa' en el nombre: {tipos_playas}")