import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / 'data_local'
csv_path = DATA_DIR / 'instalaciones_privadas_elche.csv'

print("=" * 80)
print("  CATEGORÍAS ÚNICAS DE DANZA EN CSV")
print("=" * 80)

categorias_encontradas = {}

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        categoria = row.get('categoria', '')
        if 'danza' in categoria.lower():
            if categoria not in categorias_encontradas:
                categorias_encontradas[categoria] = 0
            categorias_encontradas[categoria] += 1

print(f"\n📊 CATEGORÍAS ENCONTRADAS ({len(categorias_encontradas)} variaciones):")
print("-" * 80)
for cat, count in sorted(categorias_encontradas.items(), key=lambda x: x[1], reverse=True):
    print(f"   {count:3} → '{cat}'")

print(f"\n✅ Total: {sum(categorias_encontradas.values())} instalaciones de danza")