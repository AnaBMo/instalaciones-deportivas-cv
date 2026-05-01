from pymongo import MongoClient
from decouple import config

MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

print("=" * 80)
print("  VERIFICACIÓN: DANZA EN ELCHE")
print("=" * 80)

# 1. Total en Elche (cualquier variación del nombre)
elche_variaciones = ['Elx', 'Elche', 'ELX', 'ELCHE']
total_elche = 0

for variacion in elche_variaciones:
    count = collection.count_documents({'denom_municipio': variacion})
    if count > 0:
        print(f"\n📍 Municipio '{variacion}': {count} instalaciones")
        total_elche += count

print(f"\n📊 TOTAL en Elche (todas las variaciones): {total_elche}")

# 2. Danza en Elche
print("\n" + "=" * 80)
print("  DANZA EN ELCHE")
print("=" * 80)

for variacion in elche_variaciones:
    danza_count = collection.count_documents({
        'denom_municipio': variacion,
        'categorias': {'$regex': 'Danza', '$options': 'i'}
    })
    if danza_count > 0:
        print(f"\n🩰 Danza en '{variacion}': {danza_count}")

# 3. Ver algunos ejemplos
print("\n" + "=" * 80)
print("  EJEMPLOS DE DANZA EN ELCHE")
print("=" * 80)

ejemplos = collection.find({
    'denom_municipio': {'$in': elche_variaciones},
    'categorias': {'$regex': 'Danza', '$options': 'i'}
}).limit(5)

for doc in ejemplos:
    print(f"\n• {doc['nombre']}")
    print(f"  Municipio: {doc.get('denom_municipio')}")
    print(f"  Categorías: {doc.get('categorias')}")

# 4. Verificar si hay instalaciones privadas de Elche sin municipio asignado
print("\n" + "=" * 80)
print("  PRIVADAS DE ELCHE SIN MUNICIPIO")
print("=" * 80)

sin_municipio = collection.count_documents({
    'tipo': 'privado',
    'direccion': {'$regex': 'Elx|Elche', '$options': 'i'},
    'denom_municipio': None
})

print(f"\n⚠️  Privadas con 'Elx/Elche' en dirección pero sin municipio: {sin_municipio}")

if sin_municipio > 0:
    ejemplos_sin = collection.find({
        'tipo': 'privado',
        'direccion': {'$regex': 'Elx|Elche', '$options': 'i'},
        'denom_municipio': None
    }).limit(5)
    
    print("\nEjemplos:")
    for doc in ejemplos_sin:
        print(f"  • {doc['nombre']} - {doc['direccion']}")