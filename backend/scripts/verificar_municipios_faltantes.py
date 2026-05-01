import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / 'data_local'
csv_path = DATA_DIR / 'instalaciones_privadas_elche.csv'

print("=" * 80)
print("  MUNICIPIOS DE LAS 25 FALTANTES")
print("=" * 80)

faltantes = [
    'Danza Mari Trini', 'Espacio Fractal', 'Fem Dansa', 
    'Conservatorio de Danza', 'Escuela de Danza Infinity Dance',
    'Ferrante Dance Studio', 'Escuela de Danza Alicia Alba',
    'Dance Fusion Foley', 'Youmove Dance Studio', 'Bailamente'
]

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        nombre = row.get('nombre', '')
        if nombre in faltantes:
            print(f"\n📍 {nombre}")
            print(f"   Dirección CSV: {row.get('direccion', 'N/A')}")
            print(f"   Lat: {row.get('latitud', 'N/A')}")
            print(f"   Lng: {row.get('longitud', 'N/A')}")