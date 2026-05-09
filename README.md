# 🏟️ Instalaciones Deportivas 

Mapa interactivo con **+7.400 instalaciones deportivas** de la Comunidad Valenciana: polideportivos públicos, gimnasios, clubes, tiendas deportivas y campings.

🌐 **Demo en vivo:** [instalaciones-deportivas-cv.vercel.app](https://instalaciones-deportivas-cv.vercel.app)

---

## Qué es

Una aplicación web fullstack que permite explorar, buscar y filtrar instalaciones deportivas de las provincias de Alicante, Valencia y Castellón sobre un mapa interactivo. Incluye un panel de administración protegido para gestionar los datos.

Los datos se recopilaron mediante la Google Places API y se limpiaron y categorizaron con scripts Python propios.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, React Router, Leaflet, Axios |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Base de datos | MongoDB Atlas |
| Despliegue | Vercel (frontend) + Render (backend) |

---

## Funcionalidades

### Mapa público
- Visualización de +7.400 instalaciones con clustering dinámico
- Filtros por tipo (público, privado, tienda, camping) y categorías
- Buscador por nombre o dirección
- Popups informativos con datos de cada instalación

### Panel de administración (protegido con JWT)
- Dashboard con estadísticas y gráficos (distribución por tipo y provincia)
- Tabla de instalaciones con paginación, búsqueda y filtros
- Crear, editar y eliminar instalaciones
- Papelera con restauración de instalaciones eliminadas

---

## Estructura del proyecto

```
instalaciones-deportivas-cv/
├── backend/
│   ├── api/                  # Endpoints REST + autenticación
│   ├── config/               # Settings Django, URLs, WSGI
│   ├── scripts/              # Scripts de recopilación y limpieza de datos
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── components/Map/   # Componente del mapa Leaflet
│   │   ├── context/          # AuthContext (JWT)
│   │   ├── pages/            # Home, Login, Admin
│   │   └── services/         # Cliente API (Axios)
│   ├── package.json
│   └── vercel.json
└── README.md
```

---

## API REST

### Endpoints públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/instalaciones/` | Listado paginado con filtros |
| GET | `/api/instalaciones/{id}/` | Detalle de una instalación |
| GET | `/api/instalaciones/stats/` | Estadísticas generales |
| GET | `/api/instalaciones/by_bounds/` | Instalaciones por área del mapa |

### Endpoints protegidos (JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/instalaciones/` | Crear instalación |
| PUT | `/api/instalaciones/{id}/` | Editar instalación |
| DELETE | `/api/instalaciones/{id}/` | Eliminar (con backup) |
| GET | `/api/instalaciones/eliminadas/` | Listar eliminadas |
| POST | `/api/instalaciones/eliminadas/{id}/restaurar/` | Restaurar eliminada |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login/` | Obtener token JWT |
| GET | `/api/auth/me/` | Datos del usuario actual |
| POST | `/api/auth/logout/` | Cerrar sesión |

**Filtros disponibles:** `tipo`, `provincia`, `search`, `categorias`


---

## Datos

Los datos se recopilaron usando la **Google Places API** con búsquedas por categorías deportivas en un radio de 15-25 km alrededor de las principales ciudades de la Comunidad Valenciana. Se realizó un proceso de limpieza y recategorización para eliminar falsos positivos (tiendas no deportivas, clínicas, restaurantes, etc.).

**Estructura de cada instalación en MongoDB:**

```json
{
  "nombre": "Polideportivo Municipal",
  "direccion": "Calle Ejemplo, 1",
  "tipo": "publico",
  "categorias": ["piscinas", "fitness"],
  "latitud": 38.2699,
  "longitud": -0.6983,
  "denom_provincia": "ALICANTE",
  "rating": 4.2,
  "telefono": "965 000 000",
  "web": "https://ejemplo.com"
}
```

---

## Licencia

Proyecto personal con fines educativos y de portfolio.