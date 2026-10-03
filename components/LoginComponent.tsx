import React, { useState, useEffect } from 'react';
import { Organization, UserRole } from '../types';
import {
  LockClosedIcon,
  UserIcon,
  AcademicCapIcon,
  OfficeBuildingIcon,
  ShieldCheckIcon,
  XCircleIcon,
  KeyIcon,
} from './icons';

export interface LoginCredentials {
  mode: UserRole;
  organizationId?: string;
  studentCode?: string;
  username?: string;
  password?: string;
}

interface LoginComponentProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  onSelectOrganization: (org: Organization) => void;
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
}

type PortalView = 'STUDENT_PORTAL' | 'ADMIN_PORTAL';

const LoginComponent: React.FC<LoginComponentProps> = ({
  organizations,
  currentOrganization,
  onSelectOrganization,
  onLogin,
}) => {
  // Screen split: Student Kiosk (default) vs Staff / Admin Portal
  const [portalView, setPortalView] = useState<PortalView>('STUDENT_PORTAL');
  
  // Within Admin Portal: School Admin vs Superadmin
  const [adminRole, setAdminRole] = useState<'ADMIN' | 'SUPERADMIN'>('ADMIN');

  // Input states
  const [studentCode, setStudentCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default to first active organization
  useEffect(() => {
    if (!currentOrganization && organizations.length > 0) {
      const firstActive = organizations.find((o) => o.status === 'ACTIVE') || organizations[0];
      onSelectOrganization(firstActive);
    }
  }, [organizations, currentOrganization, onSelectOrganization]);

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = organizations.find((o) => o.id === e.target.value);
    if (selected) {
      onSelectOrganization(selected);
      setError('');
    }
  };

  const isCurrentOrgInactive =
    (portalView === 'STUDENT_PORTAL' || (portalView === 'ADMIN_PORTAL' && adminRole === 'ADMIN')) &&
    currentOrganization?.status === 'INACTIVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (portalView === 'STUDENT_PORTAL') {
      if (!currentOrganization) {
        setError('Por favor seleccione una institución educativa.');
        return;
      }
      if (currentOrganization.status === 'INACTIVE') {
        setError('Esta institución se encuentra suspendida temporalmente.');
        return;
      }
      if (!studentCode.trim()) {
        setError('Por favor ingrese su código de estudiante.');
        return;
      }

      setLoading(true);
      try {
        const result = await onLogin({
          mode: 'STUDENT',
          organizationId: currentOrganization.id,
          studentCode: studentCode.trim(),
        });
        if (!result.success) {
          setError(result.error || 'Código estudiantil no reconocido. Verifique sus datos.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error al validar código.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Admin Portal
    if (adminRole === 'ADMIN') {
      if (!currentOrganization) {
        setError('Seleccione una institución educativa.');
        return;
      }
      if (!username.trim() || !password.trim()) {
        setError('Ingrese usuario y contraseña de administrador escolar.');
        return;
      }
      setLoading(true);
      try {
        const result = await onLogin({
          mode: 'ADMIN',
          organizationId: currentOrganization.id,
          username: username.trim(),
          password: password.trim(),
        });
        if (!result.success) {
          setError(result.error || 'Credenciales incorrectas para esta institución.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error al autenticar.');
      } finally {
        setLoading(false);
      }
    } else {
      // Superadmin
      if (!username.trim() || !password.trim()) {
        setError('Ingrese usuario y contraseña de Superadministrador.');
        return;
      }
      setLoading(true);
      try {
        const result = await onLogin({
          mode: 'SUPERADMIN',
          username: username.trim(),
          password: password.trim(),
        });
        if (!result.success) {
          setError(result.error || 'Credenciales de Superadministrador incorrectas.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error al autenticar.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper quick fills for testing
  const fillStudent = (code: string, orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) onSelectOrganization(org);
    setStudentCode(code);
    setError('');
  };

  const fillAdmin = (user: string, pass: string, orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) onSelectOrganization(org);
    setAdminRole('ADMIN');
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const fillSuperadmin = () => {
    setAdminRole('SUPERADMIN');
    setUsername('superadmin');
    setPassword('password123');
    setError('');
  };

  // ==========================================
  // VIEW 1: CABINA DE VOTACIÓN DE ESTUDIANTES (DISTRACTION-FREE)
  // ==========================================
  if (portalView === 'STUDENT_PORTAL') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300">
          {/* Institutional Banner */}
          <div
            className="p-8 text-center text-white relative transition-colors duration-300"
            style={{
              backgroundColor: currentOrganization?.primaryColor || 'var(--brand-primary, #005A9C)',
            }}
          >
            <div className="mx-auto w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg mb-4">
              {currentOrganization?.logoUrl ? (
                <img
                  src={currentOrganization.logoUrl}
                  alt={currentOrganization.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <AcademicCapIcon className="w-10 h-10 text-slate-800" />
              )}
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold uppercase tracking-wider mb-2">
              Cabina Electoral Estudiantil
            </span>

            <h2 className="text-2xl font-black tracking-tight leading-snug">
              {currentOrganization?.name || 'Votación Escolar'}
            </h2>
            <p className="text-xs text-white/90 mt-1 font-medium">
              Sufragio libre, secreto, informado y transparente
            </p>
          </div>

          {/* Student Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* School Switcher (if multiple available) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institución Educativa
              </label>
              <select
                value={currentOrganization?.id || ''}
                onChange={handleOrgChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.status === 'INACTIVE' ? '(SUSPENDIDA)' : ''}
                  </option>
                ))}
              </select>

              {isCurrentOrgInactive && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs font-medium">
                  <XCircleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Institución Suspendida:</span> Las votaciones están pausadas temporalmente en este colegio.
                  </div>
                </div>
              )}
            </div>

            {/* Student Code Input */}
            <div>
              <label htmlFor="student-code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código del Estudiante (Padrón Electoral)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="student-code"
                  type="text"
                  required
                  autoFocus
                  disabled={isCurrentOrgInactive}
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ej. 2025001"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-base font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ingresa el código que te asignó tu colegio para acceder a la papeleta electoral oficial.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isCurrentOrgInactive}
              className="w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-base bg-brand-primary hover:bg-brand-primary-darker shadow-lg transition-all hover:scale-101 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando Padrón...' : 'Ingresar a Votar'}
            </button>

            {/* Demo Chips for Student Testing */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Códigos de Prueba Rápida
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fillStudent('2025001', 'uemol')}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  UEMOL: 2025001
                </button>
                <button
                  type="button"
                  onClick={() => fillStudent('GG2401', 'galileo')}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Galileo: GG2401
                </button>
              </div>
            </div>

            {/* Discreet Link to Staff / Admin Login */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setPortalView('ADMIN_PORTAL');
                  setError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-medium py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LockClosedIcon className="w-3.5 h-3.5" />
                <span>Acceso Administrativo y Docente</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PORTAL ADMINISTRATIVO Y SUPERADMIN (SEPARATED SCREEN)
  // ==========================================
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden">
        {/* Admin Header with Back Button */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => {
              setPortalView('STUDENT_PORTAL');
              setError('');
            }}
            className="absolute left-4 top-4 text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            <span>← Cabina de Estudiantes</span>
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner mt-4 mb-2">
            <ShieldCheckIcon className="w-8 h-8 text-indigo-300" />
          </div>

          <h2 className="text-2xl font-black tracking-tight">Portal Administrativo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acceso restringido para autoridades y directivos electorales
          </p>
        </div>

        {/* 2 Roles Switcher inside Admin Portal */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => { setAdminRole('ADMIN'); setError(''); }}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
              adminRole === 'ADMIN'
                ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-200/70'
            }`}
          >
            <OfficeBuildingIcon className="w-4 h-4 text-slate-700" />
            <span>Admin de Colegio</span>
          </button>

          <button
            type="button"
            onClick={() => { setAdminRole('SUPERADMIN'); setError(''); }}
            className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
              adminRole === 'SUPERADMIN'
                ? 'border-indigo-600 text-indigo-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-200/70'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
            <span>Superadministrador</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {adminRole === 'ADMIN' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institución Educativa (Colegio)
              </label>
              <select
                value={currentOrganization?.id || ''}
                onChange={handleOrgChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {adminRole === 'SUPERADMIN' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
              <span className="font-bold">Consola Central:</span> Gestión global de instituciones, tenants y supervisión del sistema.
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Usuario Autorizado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={adminRole === 'ADMIN' ? 'admin_uemol' : 'superadmin'}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-slate-900 hover:bg-slate-800 shadow-md transition-all hover:scale-101 disabled:bg-slate-400"
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión Administrativa'}
          </button>

          {/* Demo Chips */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Credenciales Demo de Administrador
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillAdmin('admin_uemol', 'password123', 'uemol')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Admin UEMOL
              </button>
              <button
                type="button"
                onClick={() => fillAdmin('admin_galileo', 'password123', 'galileo')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Admin Galileo
              </button>
              <button
                type="button"
                onClick={fillSuperadmin}
                className="px-2.5 py-1 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold transition-colors"
              >
                Superadmin Global
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
