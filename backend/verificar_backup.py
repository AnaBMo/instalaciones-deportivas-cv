from pymongo import MongoClient
from decouple import config
from pprint import pprint

client = MongoClient(config('MONGO_URI'))
db = client.get_database()

# Ver instalaciones eliminadas
eliminadas = db['instalaciones_eliminadas'].find()
print('=== INSTALACIONES ELIMINADAS ===')
for doc in eliminadas:
    print(f"\nNombre: {doc.get('nombre')}")
    print(f"Eliminado por: {doc.get('eliminado_por')}")
    print(f"Fecha eliminación: {doc.get('fecha_eliminacion')}")
    print(f"Razón: {doc.get('razon')}")
    print(f"ID original: {doc.get('instalacion_id_original')}")
