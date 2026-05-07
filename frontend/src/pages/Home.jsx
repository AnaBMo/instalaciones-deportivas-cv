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
    tipos: [],
    search: '',
    categorias: [],
  });

  // Estado de expansión de filtros
  const [categoriasExpanded, setCategoriasExpanded] = useState(false);

  // Definir categorías disponibles
  const CATEGORIAS_PRIVADAS = [
    { id: 'Fitness', nombre: 'Fitness y Gimnasios', count: 773 },
    { id: 'Deportes Generales', nombre: 'Deportes Generales', count: 520 },
    { id: 'Artes Marciales', nombre: 'Artes Marciales y Boxeo', count: 351 },
    { id: 'Natación', nombre: 'Natación', count: 241 },
    { id: 'Danza', nombre: 'Danza', count: 234 },
    { id: 'Pádel y Tenis', nombre: 'Pádel y Tenis', count: 206 },
    { id: 'Equitación', nombre: 'Equitación', count: 111 },
    { id: 'Skating', nombre: 'Skating', count: 71 },
    { id: 'Golf', nombre: 'Golf', count: 41 },
    { id: 'Escalada', nombre: 'Escalada', count: 38 },
  ];

  const CATEGORIAS_TIENDAS = [
    { id: 'tienda_deportiva', nombre: 'Deportiva', count: 346 },
    { id: 'tienda_naturaleza', nombre: 'Naturaleza y Caza', count: 289 },
    { id: 'tienda_ciclismo', nombre: 'Ciclismo', count: 256 },
    { id: 'tienda_nutricion', nombre: 'Nutrición Deportiva', count: 139 },
    { id: 'tienda_running', nombre: 'Running', count: 130 },
    { id: 'tienda_padel', nombre: 'Pádel', count: 66 },
    { id: 'tienda_acuatica', nombre: 'Deportes Acuáticos', count: 38 },
    { id: 'tienda_golf', nombre: 'Golf', count: 30 },
    { id: 'tienda_skate', nombre: 'Skate', count: 27 },
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
  const toggleTodasCategorias = (tipoCategoria) => {
    const categoriasDelTipo = tipoCategoria === 'privado' 
      ? CATEGORIAS_PRIVADAS.map(c => c.id)
      : CATEGORIAS_TIENDAS.map(c => c.id);

    const todasSeleccionadas = categoriasDelTipo.every(cat => 
      filtros.categorias.includes(cat)
    );

    if (todasSeleccionadas) {
      setFiltros(prev => ({
        ...prev,
        categorias: prev.categorias.filter(c => !categoriasDelTipo.includes(c))
      }));
    } else {
      setFiltros(prev => ({
        ...prev,
        categorias: [...new Set([...prev.categorias, ...categoriasDelTipo])]
      }));
    }
  };

  // Mostrar secciones de categorías según tipos seleccionados
  const mostrarCategoriasPrivadas = filtros.tipos.includes('privado');
  const mostrarCategoriasTiendas = filtros.tipos.includes('tienda');
  const mostrarFiltrosCategorias = mostrarCategoriasPrivadas || mostrarCategoriasTiendas;

  // Verificar si todas están seleccionadas (por sección)
  const todasPrivadasSeleccionadas = CATEGORIAS_PRIVADAS.every(cat => 
    filtros.categorias.includes(cat.id)
  );
  const todasTiendasSeleccionadas = CATEGORIAS_TIENDAS.every(cat => 
    filtros.categorias.includes(cat.id)
  );

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
            background: '#3643ba',
            color: 'white',
            padding: '15px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <h1 style={{ margin: '0 0 3px 0', fontSize: '24px' }}>
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
            padding: '12px 15px',
            textAlign: 'center',
            borderBottom: '2px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#51555a' }}>
            Mostrando <span style={{ color: '#2563eb', fontSize: '16px' }}>{visibleCount}</span> de{' '}
            <span style={{ fontSize: '16px' }}>{totalGeneral}</span>
          </div>
        </div>

        {/* BUSCADOR */}
        <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#51555a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            BUSCAR
          </div>
          <input
            type="text"
            placeholder="Nombre o dirección..."
            value={filtros.search}
            onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              boxSizing: 'border-box',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* FILTRO POR TIPO */}
        <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#51555a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TIPO
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => {
                const todosTipos = ['publico', 'privado', 'tienda', 'camping'];
                setFiltros({ ...filtros, tipos: todosTipos, categorias: [] });
                setCategoriasExpanded(true);
              }}
              style={{
                padding: '8px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                background: filtros.tipos.length === 4 ? '#3643ba' : 'white',
                color: filtros.tipos.length === 4 ? '#e4e9f1' : '#51555a',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
                transition: 'all 0.2s',
              }}
            >
              ✓ Todas
            </button>
            <button
              onClick={() => {
                setFiltros({ ...filtros, tipos: [], categorias: [] });
                setCategoriasExpanded(false);
              }}
              style={{
                padding: '8px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                color: '#51555a',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                flex: '1 1 calc(50% - 3px)',
                transition: 'all 0.2s',
              }}
            >
              ↺ Resetear
            </button>
            {['publico', 'privado', 'tienda', 'camping'].map(tipo => {
              const isActive = filtros.tipos.includes(tipo);
              const labels = {
                publico: 'Públicas',
                privado: 'Privadas',
                tienda: 'Tiendas',
                camping: 'Campings',
              };
              return (
                <button
                  key={tipo}
                  onClick={() => {
                    setFiltros(prev => {
                      const nuevosTipos = prev.tipos.includes(tipo)
                        ? prev.tipos.filter(t => t !== tipo)
                        : [...prev.tipos, tipo];
                      
                      let nuevasCategorias = [...prev.categorias];
                      if (!nuevosTipos.includes('privado')) {
                        const idsPrivadas = CATEGORIAS_PRIVADAS.map(c => c.id);
                        nuevasCategorias = nuevasCategorias.filter(c => !idsPrivadas.includes(c));
                      }
                      if (!nuevosTipos.includes('tienda')) {
                        const idsTiendas = CATEGORIAS_TIENDAS.map(c => c.id);
                        nuevasCategorias = nuevasCategorias.filter(c => !idsTiendas.includes(c));
                      }
                      
                      return { ...prev, tipos: nuevosTipos, categorias: nuevasCategorias };
                    });
                    if (tipo === 'privado' || tipo === 'tienda') {
                      setCategoriasExpanded(true);
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    border: isActive ? '2px solid #3643ba' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    background: isActive ? '#3643ba' : 'white',
                    color: isActive ? '#e4e9f1' : '#51555a',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    flex: '1 1 calc(50% - 3px)',
                    transition: 'all 0.2s',
                  }}
                >
                  {labels[tipo]} ({porTipo[tipo] || 0})
                </button>
              );
            })}
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
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#51555a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CATEGORÍAS
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
                  padding: 0,
                }}
              >
                {categoriasExpanded ? '▼ Ocultar' : '▶ Mostrar'}
              </button>
            </div>

            <div 
              style={{
                maxHeight: categoriasExpanded ? '2000px' : '0',
                overflow: 'hidden',
                transition: categoriasExpanded ? 'max-height 0.5s ease' : 'max-height 0.3s ease',
              }}
            >
              {/* Categorías Privadas */}
              {mostrarCategoriasPrivadas && (
                <div style={{ marginBottom: mostrarCategoriasTiendas ? '12px' : '0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                    Privadas
                  </div>
                  <button
                    onClick={() => toggleTodasCategorias('privado')}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      background: todasPrivadasSeleccionadas ? '#f3f4f6' : 'white',
                      color: todasPrivadasSeleccionadas ? '#3643ba' : '#51555a',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      boxShadow: todasPrivadasSeleccionadas ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    ✓ Todas
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {CATEGORIAS_PRIVADAS.map(cat => {
                      const isActive = filtros.categorias.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategoria(cat.id)}
                          style={{
                            width: 'calc(50% - 2px)',
                            padding: '6px 10px',
                            border: isActive ? '2px solid #d1d5db' : '2px solid #e5e7eb',
                            borderRadius: '6px',
                            background: isActive ? '#f3f4f6' : 'white',
                            color: isActive ? '#3643ba' : '#51555a',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {cat.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categorías Tiendas */}
              {mostrarCategoriasTiendas && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '6px' }}>
                    Tiendas
                  </div>
                  <button
                    onClick={() => toggleTodasCategorias('tienda')}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      background: todasTiendasSeleccionadas ? '#f3f4f6' : 'white',
                      color: todasTiendasSeleccionadas ? '#3643ba' : '#51555a',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      boxShadow: todasTiendasSeleccionadas ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    ✓ Todas
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {CATEGORIAS_TIENDAS.map(cat => {
                      const isActive = filtros.categorias.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategoria(cat.id)}
                          style={{
                            width: 'calc(50% - 2px)',
                            padding: '6px 10px',
                            border: isActive ? '2px solid #d1d5db' : '2px solid #e5e7eb',
                            borderRadius: '6px',
                            background: isActive ? '#f3f4f6' : 'white',
                            color: isActive ? '#3643ba' : '#51555a',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {cat.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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