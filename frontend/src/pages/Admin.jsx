import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { instalacionesAPI, adminAPI } from '../services/api';

function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarInstalaciones();
  }, []);

  const cargarInstalaciones = async () => {
    try {
      setLoading(true);
      const response = await instalacionesAPI.getAll({ page_size: 20 });
      setInstalaciones(response.data.results);
    } catch (error) {
      console.error('Error al cargar instalaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;

    const razon = prompt('Razón de eliminación:');
    if (!razon) return;

    try {
      await adminAPI.delete(id, razon);
      alert('Instalación eliminada correctamente');
      cargarInstalaciones();
    } catch (error) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Panel de Administración</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Bienvenido, <strong>{user?.username}</strong>
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => alert('Funcionalidad próximamente')}
          style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            marginRight: '10px',
          }}
        >
          + Crear Instalación
        </button>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            fontWeight: '600',
          }}
        >
          Ver Mapa Público
        </a>
      </div>

      {/* LISTA DE INSTALACIONES */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Dirección</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instalaciones.map((inst) => (
                <tr
                  key={inst._id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px' }}>{inst.nombre}</td>
                  <td style={{ padding: '12px', color: '#666' }}>{inst.direccion}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        background: inst.tipo === 'publico' ? '#d1fae5' : '#dbeafe',
                        color: inst.tipo === 'publico' ? '#065f46' : '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {inst.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => alert('Funcionalidad próximamente')}
                      style={{
                        padding: '6px 12px',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '12px',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(inst._id, inst.nombre)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;