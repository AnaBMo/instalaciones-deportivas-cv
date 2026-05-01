import csv
from pathlib import Path
from pymongo import MongoClient
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / 'data_local'
csv_path = DATA_DIR / 'instalaciones_privadas_elche.csv'

MONGO_URI = config('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database()
collection = db['instalaciones']

print("=" * 80)
print("  DEBUG: ¿POR QUÉ NO SE IMPORTARON LAS 16?")
print("=" * 80)

faltantes = [
    'Fem Dansa', 'Ferrante Dance Studio', 'Escuela de Danza Security Dance',
    'The Urban Tribe - Centro Artístico', 'Conservatorio de Danza',
    'ProDanza. Escuela Profesional de Danza San Vicente del Raspeig',
    'Estudio de Danza Mary Carmen Sereno', 'NewDanceLife - Escuela de Danza',
    'AnDanza', 'B Dance Studio'
]

print(f"\n🔍 Buscando {len(faltantes)} instalaciones faltantes...\n")

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        nombre = row.get('nombre', '')
        
        if nombre in faltantes:
            print(f"📍 {nombre}")
            print(f"   CSV categoria: '{row.get('categoria', 'N/A')}'")
            print(f"   CSV direccion: '{row.get('direccion', 'N/A')}'")
            print(f"   CSV lat: '{row.get('latitud', 'N/A')}'")
            print(f"   CSV lng: '{row.get('longitud', 'N/A')}'")
            
            # Buscar en MongoDB por nombre exacto
            mongo_doc = collection.find_one({'nombre': nombre})
            
            if mongo_doc:
                print(f"   ✅ EN MONGODB:")
                print(f"      municipio: '{mongo_doc.get('denom_municipio')}'")
                print(f"      categorias: {mongo_doc.get('categorias')}")
            else:
                print(f"   ❌ NO ESTÁ EN MONGODB")
            
            print()