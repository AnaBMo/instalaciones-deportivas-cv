import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { instalacionesAPI, adminAPI } from '../services/api';

// ============================================================
// ESTILOS CSS-IN-JS
// ============================================================
const COLORS = {
  primary: '#3643ba',
  primaryDark: '#2b35a0',
  primaryLight: '#4f5bc4',
  primaryLighter: '#7680d4',
  primaryGhost: 'rgba(54, 67, 186, 0.08)',
  primarySoft: 'rgba(54, 67, 186, 0.12)',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  bg: '#eef0f6',
  sidebar: '#252a6b',
  sidebarDark: '#1e2258',
  sidebarHover: 'rgba(255,255,255,0.08)',
  sidebarActive: 'rgba(255,255,255,0.15)',
  card: '#ffffff',
  border: '#dde0ef',
  textPrimary: '#1e2036',
  textSecondary: '#6b7194',
  textMuted: '#9ba1c4',
  white: '#ffffff',
};

const TIPO_COLORS = {
  publico: { bg: '#dcfce7', text: '#166534' },
  privado: { bg: 'rgba(54, 67, 186, 0.10)', text: '#3643ba' },
  tienda: { bg: '#f3f4f6', text: '#374151' },
  camping: { bg: '#fef3c7', text: '#92400e' },
};

const PROVINCIA_COLORS = ['#3643ba', '#4f5bc4', '#7680d4'];

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Spinner({ size = 40 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${COLORS.border}`,
          borderTopColor: COLORS.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: '14px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        border: `1px solid ${COLORS.border}`,
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(54,67,186,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = COLORS.primaryLight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = COLORS.border;
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: color || COLORS.primaryGhost,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500, marginBottom: '4px', letterSpacing: '0.3px' }}>
          {label}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}>
          {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '4px' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, colors, maxWidth = '100%' }) {
  if (!data || Object.keys(data).length === 0) return null;
  const max = Math.max(...Object.values(data));

  return (
    <div style={{ width: maxWidth }}>
      {Object.entries(data).map(([label, value], i) => (
        <div key={label} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, textTransform: 'capitalize' }}>
              {label}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colors?.[i] || COLORS.primary }}>
              {value.toLocaleString('es-ES')}
            </span>
          </div>
          <div style={{ background: COLORS.bg, borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(value / max) * 100}%`,
                height: '100%',
                background: colors?.[i] || COLORS.primary,
                borderRadius: '6px',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TipoDonutChart({ data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const colorMap = {
    publico: '#10b981',
    privado: '#3643ba',
    tienda: '#8b93c9',
    camping: '#f59e0b',
  };

  let cumulative = 0;
  const segments = Object.entries(data).map(([tipo, count]) => {
    const percentage = (count / total) * 100;
    const start = cumulative;
    cumulative += percentage;
    return { tipo, count, percentage, start, color: colorMap[tipo] || '#999' };
  });

  // Build conic-gradient
  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.percentage}%`)
    .join(', ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `conic-gradient(${gradientStops})`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: COLORS.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1 }}>
            {total.toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: '10px', color: COLORS.textMuted }}>total</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((s) => {
          const tipoInfo = TIPO_COLORS[s.tipo] || {};
          return (
            <div key={s.tipo} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '3px', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 500, textTransform: 'capitalize', minWidth: 70 }}>
                {tipoInfo.icon} {s.tipo}
              </span>
              <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                {s.count.toLocaleString('es-ES')} ({s.percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
const MENU_ITEMS = [
  { key: 'dashboard', icon: '📈', label: 'Dashboard' },
  { key: 'instalaciones', icon: '🏟️', label: 'Instalaciones' },
  { key: 'crear', icon: '✚', label: 'Nueva Instalación' },
  { key: 'eliminadas', icon: '🗑️', label: 'Eliminadas' },
];

function Sidebar({ activeSection, onNavigate, user, onLogout }) {
  return (
    <div
      style={{
        width: 260,
        height: '100vh',
        background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.sidebarDark} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {/* LOGO */}
      <div
        style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            ⚽
          </div>
          <div>
            <div style={{ color: COLORS.white, fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              DeporteCV
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.5px' }}>
              Panel Admin
            </div>
          </div>
        </div>
      </div>

      {/* MENÚ */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '10px',
                background: isActive ? COLORS.sidebarActive : 'transparent',
                color: isActive ? COLORS.white : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                marginBottom: '4px',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = COLORS.sidebarHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* SEPARADOR */}
      <div style={{ padding: '0 12px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }} />
      </div>

      {/* IR AL MAPA */}
      <div style={{ padding: '12px' }}>
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.sidebarHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: '18px' }}>🗺️</span>
          Ver Mapa Público
        </a>
      </div>

      {/* USUARIO */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.white,
            fontWeight: 700,
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {user?.username?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: COLORS.white, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || 'Admin'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Administrador</div>
        </div>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: 'none',
            borderRadius: '8px',
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(250, 250, 250, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(253, 253, 253, 0.15)')}
        >
          ⏻
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SECCIÓN: DASHBOARD
// ============================================================
function DashboardSection({ stats, loading }) {
  if (loading) return <Spinner />;
  if (!stats) return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No se pudieron cargar las estadísticas</div>;

  return (
    <div>
      {/* TÍTULO */}
      <div style={{ marginBottom: '28px', borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary }}>
          Dashboard
        </h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textSecondary, fontSize: '14px' }}>
          Vista general de las instalaciones deportivas de la Comunidad Valenciana
        </p>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          icon="🏟️"
          label="Total Instalaciones"
          value={stats.total}
          color="rgba(54, 67, 186, 0.15)"
        />
        <StatCard
          icon="🏛️"
          label="Públicas"
          value={stats.por_tipo?.publico || 0}
          color="rgba(16, 185, 129, 0.1)"
          subtitle={`${((stats.por_tipo?.publico / stats.total) * 100).toFixed(1)}% del total`}
        />
        <StatCard
          icon="🏢"
          label="Privadas"
          value={stats.por_tipo?.privado || 0}
          color="rgba(54, 67, 186, 0.15)"
          subtitle={`${((stats.por_tipo?.privado / stats.total) * 100).toFixed(1)}% del total`}
        />
        <StatCard
          icon="🛒"
          label="Tiendas"
          value={stats.por_tipo?.tienda || 0}
          color="rgba(107, 114, 128, 0.1)"
          subtitle={`${((stats.por_tipo?.tienda / stats.total) * 100).toFixed(1)}% del total`}
        />
      </div>

      {/* GRÁFICOS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Gráfico donut por tipo */}
        <div
          style={{
            background: COLORS.card,
            borderRadius: '14px',
            padding: '24px',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary }}>
            Distribución por Tipo
          </h3>
          <TipoDonutChart data={stats.por_tipo} />
        </div>

        {/* Gráfico barras por provincia */}
        <div
          style={{
            background: COLORS.card,
            borderRadius: '14px',
            padding: '24px',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary }}>
            Por Provincia
          </h3>
          <BarChart data={stats.por_provincia} colors={PROVINCIA_COLORS} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECCIÓN: TABLA DE INSTALACIONES
// ============================================================
function InstalacionesSection() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const PAGE_SIZE = 30;

  const cargarInstalaciones = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroProvincia) params.provincia = filtroProvincia;

      const response = await instalacionesAPI.getAll(params);
      setInstalaciones(response.data.results);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error cargando instalaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filtroTipo, filtroProvincia]);

  useEffect(() => {
    cargarInstalaciones();
  }, [cargarInstalaciones]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const startEdit = (inst) => {
    setEditingId(inst._id);
    setEditData({
      nombre: inst.nombre || '',
      direccion: inst.direccion || '',
      tipo: inst.tipo || '',
      latitud: inst.latitud || '',
      longitud: inst.longitud || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id) => {
    try {
      setSaving(true);
      const dataToSend = { ...editData };
      if (dataToSend.latitud) dataToSend.latitud = parseFloat(dataToSend.latitud);
      if (dataToSend.longitud) dataToSend.longitud = parseFloat(dataToSend.longitud);
      await adminAPI.update(id, dataToSend);
      setEditingId(null);
      setEditData({});
      cargarInstalaciones();
    } catch (error) {
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    const razon = prompt('Razón de eliminación:');
    if (!razon) return;
    try {
      await adminAPI.delete(id, razon);
      cargarInstalaciones();
    } catch (error) {
      alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    border: `1.5px solid ${COLORS.primary}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    background: '#f8f9ff',
  };

  return (
    <div>
      {/* TÍTULO Y FILTROS */}
      <div style={{ marginBottom: '20px', borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary }}>
          Instalaciones
        </h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textSecondary, fontSize: '14px' }}>
          {totalCount.toLocaleString('es-ES')} instalaciones encontradas
        </p>
      </div>

      {/* BARRA DE FILTROS */}
      <div
        style={{
          background: COLORS.card,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          border: `1px solid ${COLORS.border}`,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            🔍 Buscar
          </button>
        </form>

        <select
          value={filtroTipo}
          onChange={handleFilterChange(setFiltroTipo)}
          style={{
            padding: '10px 14px',
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
            background: COLORS.white,
            minWidth: 140,
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="publico">Público</option>
          <option value="privado">Privado</option>
          <option value="tienda">Tienda</option>
          <option value="camping">Camping</option>
        </select>

        <select
          value={filtroProvincia}
          onChange={handleFilterChange(setFiltroProvincia)}
          style={{
            padding: '10px 14px',
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
            background: COLORS.white,
            minWidth: 140,
          }}
        >
          <option value="">Todas las provincias</option>
          <option value="ALICANTE">Alicante</option>
          <option value="VALENCIA">Valencia</option>
          <option value="CASTELLÓN">Castellón</option>
        </select>

        {(search || filtroTipo || filtroProvincia) && (
          <button
            onClick={() => {
              setSearch('');
              setSearchInput('');
              setFiltroTipo('');
              setFiltroProvincia('');
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              background: COLORS.dangerLight,
              color: COLORS.danger,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* TABLA */}
      {loading ? (
        <Spinner />
      ) : (
        <div
          style={{
            background: COLORS.card,
            borderRadius: '14px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(54, 67, 186, 0.04)', borderBottom: `2px solid ${COLORS.primary}` }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Dirección</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', width: 100 }}>Tipo</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', width: 130 }}>Coordenadas</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', width: 130 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instalaciones.map((inst, idx) => {
                  const isEditing = editingId === inst._id;
                  const tipoInfo = TIPO_COLORS[inst.tipo] || TIPO_COLORS.tienda;

                  return (
                    <tr
                      key={inst._id}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: isEditing ? '#f0f3ff' : idx % 2 === 0 ? COLORS.white : '#fafbfe',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isEditing) e.currentTarget.style.background = '#f5f6fc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditing) e.currentTarget.style.background = idx % 2 === 0 ? COLORS.white : '#fafbfe';
                      }}
                    >
                      <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                        {isEditing ? (
                          <input value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} style={inputStyle} />
                        ) : (
                          <span style={{ fontWeight: 500, color: COLORS.textPrimary }}>{inst.nombre}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                        {isEditing ? (
                          <input value={editData.direccion} onChange={(e) => setEditData({ ...editData, direccion: e.target.value })} style={inputStyle} />
                        ) : (
                          <span style={{ color: COLORS.textSecondary }}>{inst.direccion}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <select value={editData.tipo} onChange={(e) => setEditData({ ...editData, tipo: e.target.value })} style={{ ...inputStyle, width: 'auto', padding: '6px 8px' }}>
                            <option value="publico">Público</option>
                            <option value="privado">Privado</option>
                            <option value="tienda">Tienda</option>
                            <option value="camping">Camping</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              background: tipoInfo.bg,
                              color: tipoInfo.text,
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tipoInfo.icon} {inst.tipo}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              value={editData.latitud}
                              onChange={(e) => setEditData({ ...editData, latitud: e.target.value })}
                              style={{ ...inputStyle, width: 75, textAlign: 'center' }}
                              placeholder="Lat"
                            />
                            <input
                              value={editData.longitud}
                              onChange={(e) => setEditData({ ...editData, longitud: e.target.value })}
                              style={{ ...inputStyle, width: 75, textAlign: 'center' }}
                              placeholder="Lng"
                            />
                          </div>
                        ) : (
                          <span style={{ color: COLORS.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
                            {inst.latitud?.toFixed(4)}, {inst.longitud?.toFixed(4)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => saveEdit(inst._id)}
                              disabled={saving}
                              style={{
                                padding: '6px 12px',
                                background: COLORS.success,
                                color: COLORS.white,
                                border: 'none',
                                borderRadius: '6px',
                                cursor: saving ? 'wait' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                opacity: saving ? 0.7 : 1,
                              }}
                            >
                              {saving ? '...' : '✓ Guardar'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: '6px 12px',
                                background: COLORS.bg,
                                color: COLORS.textSecondary,
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => startEdit(inst)}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(54,67,186,0.08)',
                                color: COLORS.primary,
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(54,67,186,0.15)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(54,67,186,0.08)')}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDelete(inst._id, inst.nombre)}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(239,68,68,0.08)',
                                color: COLORS.danger,
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: `1px solid ${COLORS.border}`,
              background: '#fafbfe',
            }}
          >
            <span style={{ color: COLORS.textSecondary, fontSize: '13px' }}>
              Página {page} de {totalPages} · {totalCount.toLocaleString('es-ES')} resultados
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: '12px' }}
              >
                ⟪
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '8px 14px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: '13px', fontWeight: 600 }}
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: '8px 14px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: '13px', fontWeight: 600 }}
              >
                Siguiente →
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: '12px' }}
              >
                ⟫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECCIÓN: CREAR INSTALACIÓN
// ============================================================
function CrearSection({ onCreated }) {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    tipo: 'publico',
    latitud: '',
    longitud: '',
    provincia: '',
    categorias: '',
    telefono: '',
    web: '',
    rating: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.nombre || !formData.direccion || !formData.latitud || !formData.longitud) {
      setMessage({ type: 'error', text: 'Nombre, dirección y coordenadas son obligatorios.' });
      return;
    }

    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        latitud: parseFloat(formData.latitud),
        longitud: parseFloat(formData.longitud),
      };
      // Convertir categorías a array
      if (formData.categorias) {
        dataToSend.categorias = formData.categorias.split(',').map((c) => c.trim());
      } else {
        dataToSend.categorias = [];
      }
      if (formData.rating) dataToSend.rating = parseFloat(formData.rating);
      else delete dataToSend.rating;

      await adminAPI.create(dataToSend);
      setMessage({ type: 'success', text: '¡Instalación creada correctamente!' });
      setFormData({ nombre: '', direccion: '', tipo: 'publico', latitud: '', longitud: '', provincia: '', categorias: '', telefono: '', web: '', rating: '' });
      if (onCreated) onCreated();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al crear la instalación.' });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: COLORS.white,
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '6px',
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary }}>
          Nueva Instalación
        </h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textSecondary, fontSize: '14px' }}>
          Añade una nueva instalación deportiva a la base de datos
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 500,
            fontSize: '14px',
            background: message.type === 'success' ? '#dcfce7' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      <div
        style={{
          background: COLORS.card,
          borderRadius: '14px',
          padding: '28px',
          border: `1px solid ${COLORS.border}`,
          maxWidth: 700,
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            {/* Nombre - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre *</label>
              <input
                value={formData.nombre}
                onChange={handleChange('nombre')}
                placeholder="Ej: Polideportivo Municipal de Elche"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Dirección - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Dirección *</label>
              <input
                value={formData.direccion}
                onChange={handleChange('direccion')}
                placeholder="Ej: Calle Mayor, 25, 03201 Elche"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select value={formData.tipo} onChange={handleChange('tipo')} style={fieldStyle}>
                <option value="publico"> Pública</option>
                <option value="privado"> Privada</option>
                <option value="tienda"> Tienda</option>
                <option value="camping"> Camping</option>
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label style={labelStyle}>Provincia</label>
              <select value={formData.provincia} onChange={handleChange('provincia')} style={fieldStyle}>
                <option value="">Seleccionar...</option>
                <option value="ALICANTE">Alicante</option>
                <option value="VALENCIA">Valencia</option>
                <option value="CASTELLÓN">Castellón</option>
              </select>
            </div>

            {/* Latitud */}
            <div>
              <label style={labelStyle}>Latitud *</label>
              <input
                type="number"
                step="any"
                value={formData.latitud}
                onChange={handleChange('latitud')}
                placeholder="Ej: 38.2699"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Longitud */}
            <div>
              <label style={labelStyle}>Longitud *</label>
              <input
                type="number"
                step="any"
                value={formData.longitud}
                onChange={handleChange('longitud')}
                placeholder="Ej: -0.6983"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Categorías - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Categorías</label>
              <input
                value={formData.categorias}
                onChange={handleChange('categorias')}
                placeholder="Separadas por comas: fitness, padel_tenis, piscinas"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
              <span style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px', display: 'block' }}>
                Separar con comas. Ej: artes_marciales, danza, fitness, golf, padel_tenis, piscinas, escalada, equitacion, skating, deportes_generales
              </span>
            </div>

            {/* Teléfono */}
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                value={formData.telefono}
                onChange={handleChange('telefono')}
                placeholder="Ej: 965 123 456"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Web */}
            <div>
              <label style={labelStyle}>Web</label>
              <input
                value={formData.web}
                onChange={handleChange('web')}
                placeholder="Ej: https://www.ejemplo.com"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {/* Rating */}
            <div>
              <label style={labelStyle}>Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={handleChange('rating')}
                placeholder="Ej: 4.5"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>
          </div>

          {/* BOTÓN SUBMIT */}
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '24px',
              padding: '14px 32px',
              background: saving ? COLORS.textMuted : COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              cursor: saving ? 'wait' : 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Guardando...' : '✓ Crear Instalación'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SECCIÓN: ELIMINADAS
// ============================================================
function EliminadasSection({ onRestored }) {
  const [eliminadas, setEliminadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [restoring, setRestoring] = useState(null);

  const cargarEliminadas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEliminadas({ page, page_size: 20 });
      setEliminadas(response.data.results);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error cargando eliminadas:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    cargarEliminadas();
  }, [cargarEliminadas]);

  const handleRestaurar = async (id, nombre) => {
    if (!window.confirm(`¿Restaurar "${nombre}" a la colección principal?`)) return;
    try {
      setRestoring(id);
      await adminAPI.restaurar(id);
      cargarEliminadas();
      if (onRestored) onRestored();
    } catch (error) {
      alert('Error al restaurar: ' + (error.response?.data?.error || error.message));
    } finally {
      setRestoring(null);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return fecha;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', borderLeft: `4px solid ${COLORS.primary}`, paddingLeft: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: COLORS.textPrimary }}>
          Instalaciones Eliminadas
        </h2>
        <p style={{ margin: '4px 0 0', color: COLORS.textSecondary, fontSize: '14px' }}>
          {totalCount} instalación{totalCount !== 1 ? 'es' : ''} en backup · Puedes restaurarlas a la colección principal
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : eliminadas.length === 0 ? (
        <div
          style={{
            background: COLORS.card,
            borderRadius: '14px',
            padding: '50px 40px',
            border: `1px solid ${COLORS.border}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: COLORS.textPrimary, marginBottom: '8px' }}>No hay eliminadas</h3>
          <p style={{ color: COLORS.textSecondary, fontSize: '14px', maxWidth: 400, margin: '0 auto' }}>
            La papelera está vacía. Cuando elimines una instalación, aparecerá aquí con opción de restaurarla.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: COLORS.card,
            borderRadius: '14px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(239, 68, 68, 0.04)', borderBottom: `2px solid ${COLORS.danger}` }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Nombre</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Razón</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Eliminado por</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: COLORS.textSecondary, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', width: 120 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {eliminadas.map((inst, idx) => {
                  const tipoInfo = TIPO_COLORS[inst.tipo] || TIPO_COLORS.tienda;
                  const isRestoring = restoring === inst._id;

                  return (
                    <tr
                      key={inst._id}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: idx % 2 === 0 ? COLORS.white : '#fafbfe',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f6fc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? COLORS.white : '#fafbfe')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: COLORS.textPrimary }}>{inst.nombre}</div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>{inst.direccion}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: tipoInfo.bg,
                            color: tipoInfo.text,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tipoInfo.icon} {inst.tipo}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: COLORS.textSecondary, maxWidth: 200 }}>
                        {inst.razon || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>
                        {inst.eliminado_por || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: COLORS.textMuted, fontSize: '12px' }}>
                        {formatFecha(inst.fecha_eliminacion)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRestaurar(inst._id, inst.nombre)}
                          disabled={isRestoring}
                          style={{
                            padding: '7px 14px',
                            background: isRestoring ? COLORS.textMuted : COLORS.success,
                            color: COLORS.white,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isRestoring ? 'wait' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            transition: 'background 0.15s',
                            opacity: isRestoring ? 0.7 : 1,
                          }}
                          onMouseEnter={(e) => { if (!isRestoring) e.currentTarget.style.background = '#059669'; }}
                          onMouseLeave={(e) => { if (!isRestoring) e.currentTarget.style.background = COLORS.success; }}
                        >
                          {isRestoring ? '...' : '♻️ Restaurar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderTop: `1px solid ${COLORS.border}`,
                background: '#fafbfe',
              }}
            >
              <span style={{ color: COLORS.textSecondary, fontSize: '13px' }}>
                Página {page} de {totalPages} · {totalCount} resultados
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ padding: '8px 14px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: '13px', fontWeight: 600 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ padding: '8px 14px', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.white, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: '13px', fontWeight: 600 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL: ADMIN
// ============================================================
function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await instalacionesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection stats={stats} loading={statsLoading} />;
      case 'instalaciones':
        return <InstalacionesSection />;
      case 'crear':
        return <CrearSection onCreated={loadStats} />;
      case 'eliminadas':
        return <EliminadasSection onRestored={loadStats} />;
      default:
        return <DashboardSection stats={stats} loading={statsLoading} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      {/* SIDEBAR */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: '32px 36px',
          minHeight: '100vh',
        }}
      >
        {renderSection()}
      </main>
    </div>
  );
}

export default Admin;