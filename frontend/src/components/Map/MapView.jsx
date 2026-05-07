import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { instalacionesAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';

// Configurar iconos de Leaflet (fix para Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Iconos personalizados por tipo
const iconosPorTipo = {
  publico: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">🏛️</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  privado: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">🏢</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  tienda: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #6b7280; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">🛒</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
  camping: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #f59e0b; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="font-size: 16px;">🏕️</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  }),
};

// Icono de cluster personalizado
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let color = '#3b82f6';

  if (count > 100) {
    size = 'large';
    color = '#dc2626';
  } else if (count > 50) {
    size = 'medium';
    color = '#f59e0b';
  }

  const sizeMap = {
    small: '40px',
    medium: '50px',
    large: '60px',
  };

  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${sizeMap[size]};
      height: ${sizeMap[size]};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size === 'large' ? '18px' : '14px'};
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(parseInt(sizeMap[size]), parseInt(sizeMap[size]), true),
  });
};

// Componente que maneja eventos del mapa
function MapEventHandler({ filtros, onInstallationsLoad }) {
  const map = useMapEvents({
    moveend: () => {
      loadVisibleInstallations();
    },
    zoomend: () => {
      loadVisibleInstallations();
    },
  });

  const loadVisibleInstallations = async () => {
    const bounds = map.getBounds();
    const params = {
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    };

    // Aplicar filtros
    if (filtros.tipos && filtros.tipos.length > 0) {
        params.tipo = filtros.tipos.join(',');
    }
    if (filtros.search) {
      params.search = filtros.search;
    }
    // ⬅️ NUEVO: Filtro por categorías
    if (filtros.categorias && filtros.categorias.length > 0) {
      params.categorias = filtros.categorias.join(',');
    }

    try {
      const response = await instalacionesAPI.getByBounds(params);
      onInstallationsLoad(response.data.results, response.data.limited);
    } catch (error) {
      console.error('Error cargando instalaciones del área:', error);
    }
  };

  // Cargar instalaciones cuando cambien los filtros
  useEffect(() => {
    loadVisibleInstallations();
  }, [filtros]);

  return null;
}

function MapView({ filtros, onMapUpdate }) {
  const [instalacionesVisible, setInstalacionesVisible] = useState([]);
  const [limited, setLimited] = useState(false);

  // Centro de la Comunidad Valenciana
  const centro = [39.4840, -0.7533];

  // Callback estable para recibir instalaciones del MapEventHandler
  const handleInstallationsLoad = useCallback((installations, isLimited) => {
    setInstalacionesVisible(installations);
    setLimited(isLimited);
    
    // Notificar al padre inmediatamente
    if (onMapUpdate) {
      onMapUpdate(installations);
    }
  }, [onMapUpdate]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {limited && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fef3c7',
            color: '#92400e',
            padding: '8px 16px',
            borderRadius: '6px',
            zIndex: 1000,
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          ⚠️ Mostrando máximo 500 instalaciones. Haz zoom para ver más detalles.
        </div>
      )}

      <MapContainer
        center={centro}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler 
          filtros={filtros} 
          onInstallationsLoad={handleInstallationsLoad}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={50}
        >
          {instalacionesVisible.map((inst) => {
            // Formatear categorías para mostrar en el popup
            const categoriasTexto = inst.categorias && inst.categorias.length > 0
              ? inst.categorias.join(', ')
              : '';

            return (
              <Marker
                key={inst._id}
                position={[inst.latitud, inst.longitud]}
                icon={iconosPorTipo[inst.tipo] || iconosPorTipo.privado}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {inst.nombre}
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                      📍 {inst.direccion}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>
                      🏙️ {inst.denom_municipio} ({inst.denom_provincia})
                    </p>
                    {categoriasTexto && (
                      <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                        🏷️ {categoriasTexto}
                      </p>
                    )}
                    {inst.rating && (
                      <p style={{ margin: '5px 0', fontSize: '13px', color: '#fbbf24' }}>
                        ⭐ {inst.rating}
                      </p>
                    )}
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        background: inst.tipo === 'publico' ? '#d1fae5' : '#dbeafe',
                        color: inst.tipo === 'publico' ? '#065f46' : '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {inst.tipo}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export default MapView;