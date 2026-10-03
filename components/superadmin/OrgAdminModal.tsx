import React, { useState, useEffect } from 'react';
import { Organization, User } from '../../types';
import * as apiService from '../../api/apiService';
import { KeyIcon, UserIcon, ShieldCheckIcon } from '../icons';

interface OrgAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export const OrgAdminModal: React.FC<OrgAdminModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && organization) {
      loadAdmins();
      setShowAddForm(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, organization]);

  const loadAdmins = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const orgAdmins = await apiService.getOrgAdmins(organization.id);
      setAdmins(orgAdmins);
    } catch (e: any) {
      setError('Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    if (!username.trim() || !name.trim()) {
      setError('Usuario y nombre son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiService.createOrgAdmin(organization.id, {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim() || 'password123',
      });
      setSuccess(`Administrador '${username}' creado con éxito.`);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('password123');
      setShowAddForm(false);
      await loadAdmins();
    } catch (err: any) {
      setError(err?.message || 'Error al crear administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !organization) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: organization.primaryColor }}
            >
              {organization.code?.slice(0, 3) || 'ORG'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Administradores Institucionales
              </h3>
              <p className="text-xs text-slate-500">{organization.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Lista de administradores actuales */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Cuentas con Acceso ({admins.length})
            </h4>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>+ Asignar Nuevo Administrador</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Cargando administradores...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No hay administradores registrados para esta institución.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{admin.name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        Usuario: <span className="font-semibold text-slate-700">{admin.username || admin.codigo}</span> {admin.email ? `• ${admin.email}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <ShieldCheckIcon className="w-3.5 h-3.5 mr-1" />
                    ORG_ADMIN
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario para nuevo administrador */}
        {showAddForm && (
          <form onSubmit={handleCreateAdmin} className="mt-6 pt-5 border-t border-slate-200 space-y-3.5 bg-slate-50 p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyIcon className="w-4 h-4 text-slate-700" />
                Registrar Nuevo Administrador para {organization.code}
              </h5>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`admin_${organization.id}`}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@colegio.edu"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:bg-slate-400"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar y Asignar Cuenta'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
