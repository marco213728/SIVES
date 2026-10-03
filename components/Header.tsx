import React from 'react';
import { User, Organization } from '../types';
import { LogOutIcon, UserCircleIcon, CogIcon, ShieldCheckIcon, SwitchHorizontalIcon } from './icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  organization: Organization | null;
  onNavigateToSettings: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  isSuperadminImpersonating?: boolean;
  onReturnToSuperadmin?: () => void;
}

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  organization,
  onNavigateToSettings,
  isHighContrast,
  onToggleHighContrast,
  isSuperadminImpersonating,
  onReturnToSuperadmin,
}) => {
  const isSuperadmin = user?.role === 'SUPERADMIN' || user?.rol === 'Superadmin';
  const isAdmin = user?.role === 'ADMIN' || user?.rol === 'Admin';
  const isStudent = user?.role === 'STUDENT' || user?.rol === 'Estudiante';

  return (
    <header className="bg-brand-primary shadow-lg transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3.5">
            {isSuperadmin && !isSuperadminImpersonating ? (
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
                    SIVES
                  </h1>
                  <span className="text-xs text-white/80 font-medium tracking-wide">Plataforma Multi-Tenant</span>
                </div>
              </div>
            ) : (
              <>
                {organization?.logoUrl ? (
                  <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
                    <img src={organization.logoUrl} alt={organization.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-xl">
                    S
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {organization?.name || 'SIVES'}
                  </h1>
                  {organization?.code && (
                    <span className="text-xs text-white/80 font-mono tracking-wider">
                      {organization.code}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Return to Superadmin Panel if inspecting */}
            {isSuperadminImpersonating && onReturnToSuperadmin && (
              <button
                type="button"
                onClick={onReturnToSuperadmin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-900 text-white text-xs font-bold border border-indigo-300/30 shadow-xs transition-colors"
                title="Volver a la vista central de Superadministrador"
              >
                <SwitchHorizontalIcon className="w-4 h-4" />
                <span>Panel Superadmin</span>
              </button>
            )}

            {/* High Contrast Toggle */}
            <button
              onClick={onToggleHighContrast}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors duration-200"
              title={isHighContrast ? "Desactivar modo de alto contraste" : "Activar modo de alto contraste"}
              aria-label="Alto contraste"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
              
            {user && (
              <>
                {/* User info & Role Badge */}
                <div className="flex items-center space-x-2 text-white">
                  <UserCircleIcon className="h-6 w-6"/>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold leading-tight">
                      {user.name || `${user.primer_nombre || ''} ${user.primer_apellido || ''}`.trim()}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isSuperadmin && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                          Superadmin
                        </span>
                      )}
                      {isAdmin && !isSuperadmin && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-500 text-white">
                          Admin Escolar
                        </span>
                      )}
                      {isStudent && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white font-mono">
                          {user.studentCode || user.codigo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Settings icon for Admins */}
                {(isAdmin || isSuperadmin) && (
                  <button
                    onClick={onNavigateToSettings}
                    className="p-2 rounded-full text-white hover:bg-white/20"
                    title="Configuración"
                    aria-label="Configuración"
                  >
                    <CogIcon className="h-6 w-6" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1.5 bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <LogOutIcon className="h-4 w-4 text-slate-700" />
                  <span>Salir</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
