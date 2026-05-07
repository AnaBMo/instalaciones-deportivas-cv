import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { instalacionesAPI } from '../services/api';
import MapView from '../components/Map/MapView';

function Home() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [porTipo, setPorTipo] = useState({});
  
  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    search: '',
    categorias: [], 
  });

  // Estado de expansión de filtros
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);

  // Definir categorías disponibles
  const CATEGORIAS_PRIVADAS = [
    { id: 'Fitness', nombre: 'Fitness y Gimnasios', count: 0 },
    { id: 'Deportes Generales', nombre: 'Deportes Generales', count: 0 },
    { id: 'Artes Marciales', nombre: 'Artes Marciales y Boxeo', count: 0 },
    { id: 'Natación', nombre: 'Natación', count: 0 },
    { id: 'Danza', nombre: 'Danza', count: 0 },
    { id: 'Pádel y Tenis', nombre: 'Pádel y Tenis', count: 0 },
    { id: 'Equitación', nombre: 'Equitación', count: 0 },
    { id: 'Skating', nombre: 'Skating', count: 0 },
    { id: 'Golf', nombre: 'Golf', count: 0 },
    { id: 'Escalada', nombre: 'Escalada', count: 0 },
  ];

  const CATEGORIAS_TIENDAS = [
    { id: 'tienda_deportiva', nombre: 'Deportiva', count: 0 },
    { id: 'tienda_naturaleza', nombre: 'Naturaleza y Caza', count: 0 },
    { id: 'tienda_ciclismo', nombre: 'Ciclismo', count: 0 },
    { id: 'tienda_nutricion', nombre: 'Nutrición Deportiva', count: 0 },
    { id: 'tienda_running', nombre: 'Running', count: 0 },
    { id: 'tienda_padel', nombre: 'Pádel', count: 0 },
    { id: 'tienda_acuatica', nombre: 'Deportes Acuáticos', count: 0 },
    { id: 'tienda_golf', nombre: 'Golf', count: 0 },
    { id: 'tienda_skate', nombre: 'Skate', count: 0 },
  ];

  // Cargar total general solo al inicio
  useEffect(() => {
    const cargarTotalGeneral = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await instalacionesAPI.getAll({ page_size: 1 });
        setTotalGeneral(response.data.count);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setError('Error al cargar estadísticas. Verifica que el backend esté corriendo.');
      } finally {
        setLoading(false);
      }
    };

    cargarTotalGeneral();
  }, []);

  // Callback estable para actualizar contadores
  const handleMapUpdate = useCallback((instalaciones) => {
    setVisibleCount(instalaciones.length);
    
    const nuevosPorTipo = instalaciones.reduce((acc, inst) => {
      acc[inst.tipo] = (acc[inst.tipo] || 0) + 1;
      return acc;
    }, {});
    
    setPorTipo(nuevosPorTipo);
  }, []);

  // Función para toggle de categorías
  const toggleCategoria = (categoriaId) => {
    setFiltros(prev => {
      const categorias = prev.categorias.includes(categoriaId)
        ? prev.categorias.filter(c => c !== categoriaId)
        : [...prev.categorias, categoriaId];
      
      return { ...prev, categorias };
    });
  };

  // Función para seleccionar/deseleccionar todas las categorías
  const toggleTodasCategorias = () => {
    const categoriasActuales = filtros.tipo === 'privado' 
      ? CATEGORIAS_PRIVADAS.map(c => c.id)
      : CATEGORIAS_TIENDAS.map(c => c.id);

    const todasSeleccionadas = categoriasActuales.every(cat => 
      filtros.categorias.includes(cat)
    );

    if (todasSeleccionadas) {
      // Deseleccionar todas
      setFiltros(prev => ({
        ...prev,
        categorias: prev.categorias.filter(c => !categoriasActuales.includes(c))
      }));
    } else {
      // Seleccionar todas
      setFiltros(prev => ({
        ...prev,
        categorias: [...new Set([...prev.categorias, ...categoriasActuales])]
      }));
    }
  };

  // Obtener categorías según el tipo seleccionado
  const categoriasActuales = filtros.tipo === 'privado' 
    ? CATEGORIAS_PRIVADAS 
    : filtros.tipo === 'tienda' 
    ? CATEGORIAS_TIENDAS 
    : [];

  const mostrarFiltrosCategorias = filtros.tipo === 'privado' || filtros.tipo === 'tienda';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* PANEL LATERAL IZQUIERDO */}
      <div
        style={{
          width: '380px',
          background: 'white',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
            🏃‍♂️ Instalaciones Deportivas
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Comunidad Valenciana
          </p>
          
          {!isAuthenticated && (
            <a
              href="/login"
              style={{
                display: 'inline-block',
                marginTop: '15px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              🔐 Admin Login
            </a>
          )}
          
          {isAuthenticated && (
            <a
              href="/admin"
              style={{
                display: 'inline-block',
                marginTop: '15px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              ⚙️ Panel Admin
            </a>
          )}
        </div>

        {/* CONTADOR */}
        <div
          style={{
            background: '#f3f4f6',
            padding: '15px',
            textAlign: 'center',
            borderBottom: '2px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
            Mostrando <span style={{ color: '#2563eb', fontSize: '16px' }}>{visibleCount}</span> de{' '}
            <span style={{ fontSize: '16px' }}>{totalGeneral}</span>
          </div>
        </div>

        {/* FILTROS */}
        <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
            🔍 BUSCAR
          </div>
          <input
            type="text"
            placeholder="Nombre o dirección..."
            value={filtros.search}
            onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
            📌 TIPO
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => setFiltros({ ...filtros, tipo: '', categorias: [] })}
              style={{
                padding: '8px 14px',
                border: filtros.tipo === '' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipo === '' ? '#2563eb' : 'white',
                color: filtros.tipo === '' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
              }}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltros({ ...filtros, tipo: 'publico', categorias: [] })}
              style={{
                padding: '8px 14px',
                border: filtros.tipo === 'publico' ? '2px solid #10b981' : '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipo === 'publico' ? '#10b981' : 'white',
                color: filtros.tipo === 'publico' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
              }}
            >
              🏛️ Públicas ({porTipo.publico || 0})
            </button>
            <button
              onClick={() => {
                const nuevoTipo = filtros.tipo === 'privado' ? '' : 'privado';
                setFiltros({ 
                  ...filtros, 
                  tipo: nuevoTipo,
                  categorias: nuevoTipo === 'privado' ? filtros.categorias : []
                });
                if (nuevoTipo === 'privado') {
                  setCategoriasExpanded(true);
                }
              }}
              style={{
                padding: '8px 14px',
                border: filtros.tipo === 'privado' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipo === 'privado' ? '#3b82f6' : 'white',
                color: filtros.tipo === 'privado' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
              }}
            >
              🏢 Privadas ({porTipo.privado || 0})
            </button>
            <button
              onClick={() => {
                const nuevoTipo = filtros.tipo === 'tienda' ? '' : 'tienda';
                setFiltros({ 
                  ...filtros, 
                  tipo: nuevoTipo,
                  categorias: nuevoTipo === 'tienda' ? filtros.categorias : []
                });
                if (nuevoTipo === 'tienda') {
                  setCategoriasExpanded(true);
                }
              }}
              style={{
                padding: '8px 14px',
                border: filtros.tipo === 'tienda' ? '2px solid #6b7280' : '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipo === 'tienda' ? '#6b7280' : 'white',
                color: filtros.tipo === 'tienda' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
              }}
            >
              🛒 Tiendas ({porTipo.tienda || 0})
            </button>
            <button
              onClick={() => setFiltros({ ...filtros, tipo: 'camping', categorias: [] })}
              style={{
                padding: '8px 14px',
                border: filtros.tipo === 'camping' ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipo === 'camping' ? '#f59e0b' : 'white',
                color: filtros.tipo === 'camping' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
              }}
            >
              🏕️ Campings ({porTipo.camping || 0})
            </button>
          </div>
        </div>

        {/* FILTROS POR CATEGORÍAS */}
        {mostrarFiltrosCategorias && (
          <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                {filtros.tipo === 'privado' ? '🏢 CATEGORÍAS PRIVADAS' : '🛒 CATEGORÍAS TIENDAS'}
              </div>
              <button
                onClick={() => setCategoriasExpanded(!categoriasExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                {categoriasExpanded ? '▼ Ocultar' : '▶ Mostrar'}
              </button>
            </div>

            {categoriasExpanded && (
              <>
                <button
                  onClick={toggleTodasCategorias}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    background: '#f3f4f6',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  ✓ Todas
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {categoriasActuales.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        width: 'calc(50% - 2px)',
                        padding: '6px 10px',
                        border: filtros.categorias.includes(cat.id) 
                          ? '2px solid #93c5fd' 
                          : '2px solid #e5e7eb',
                        borderRadius: '6px',
                        background: filtros.categorias.includes(cat.id) 
                          ? '#93c5fd' 
                          : 'white',
                        color: filtros.categorias.includes(cat.id) 
                          ? '#1e3a8a' 
                          : '#374151',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* LEYENDA */}
        <div style={{ padding: '15px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
            📖 LEYENDA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>🏛️</span> Públicas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>🏢</span> Privadas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>🛒</span> Tiendas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>🏕️</span> Campings
            </div>
          </div>
        </div>
      </div>

      {/* MAPA A LA DERECHA */}
      <div style={{ flex: 1, position: 'relative' }}>
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              background: '#fee',
              color: '#c33',
              padding: '15px',
              borderRadius: '6px',
              zIndex: 1000,
            }}
          >
            {error}
          </div>
        )}
        
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <p>Cargando mapa...</p>
          </div>
        ) : (
          <MapView filtros={filtros} onMapUpdate={handleMapUpdate} />
        )}
      </div>
    </div>
  );
}

export default Home;