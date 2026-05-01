import csv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / 'data_local'
csv_path = DATA_DIR / 'instalaciones_privadas_elche.csv'

print("=" * 80)
print("  DIAGNÓSTICO: IMPORTACIÓN DE DANZA DESDE CSV")
print("=" * 80)

total = 0
con_danza = 0
sin_coordenadas = 0
coordenadas_invalidas = 0
importadas_ok = []
errores = []

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        total += 1
        categoria = row.get('categoria', '').lower()
        
        if 'danza' in categoria:
            con_danza += 1
            
            # Verificar coordenadas
            lat = row.get('latitud', row.get('lat', ''))
            lng = row.get('longitud', row.get('lng', ''))
            
            if not lat or not lng or lat == '' or lng == '':
                sin_coordenadas += 1
                errores.append({
                    'nombre': row.get('nombre'),
                    'razon': 'Sin coordenadas',
                    'lat': lat,
                    'lng': lng
                })
            else:
                try:
                    lat_float = float(lat)
                    lng_float = float(lng)
                    importadas_ok.append(row.get('nombre'))
                except:
                    coordenadas_invalidas += 1
                    errores.append({
                        'nombre': row.get('nombre'),
                        'razon': 'Coordenadas inválidas',
                        'lat': lat,
                        'lng': lng
                    })

print(f"\n📊 TOTALES:")
print(f"   Total instalaciones en CSV: {total}")
print(f"   Con 'danza' en categoría: {con_danza}")
print(f"   Sin coordenadas: {sin_coordenadas}")
print(f"   Coordenadas inválidas: {coordenadas_invalidas}")
print(f"   Deberían importarse: {len(importadas_ok)}")

if errores:
    print(f"\n❌ INSTALACIONES QUE NO SE IMPORTARON ({len(errores)}):")
    print("-" * 80)
    for err in errores[:10]:  # Mostrar primeras 10
        print(f"\n   • {err['nombre']}")
        print(f"     Razón: {err['razon']}")
        print(f"     lat: '{err['lat']}', lng: '{err['lng']}'")
    
    if len(errores) > 10:
        print(f"\n   ... y {len(errores) - 10} más")

print(f"\n✅ RESUMEN:")
print(f"   CSV tiene: {con_danza} con danza")
print(f"   Se importaron bien: {len(importadas_ok)}")
print(f"   Se perdieron: {len(errores)}")