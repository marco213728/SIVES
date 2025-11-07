import React from 'react';
import { User, Organization } from '../types';
import { LogOutIcon, UserCircleIcon, CogIcon, EyeIcon } from './icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  organization: Organization | null;
  onNavigateToSettings: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, organization, onNavigateToSettings, isHighContrast, onToggleHighContrast }) => {
  return (
    <header className="bg-brand-primary shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            {organization?.logoUrl ? (
                <img src={organization.logoUrl} alt="Organization Logo" className="h-12 w-auto" />
            ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                SIVES
                </h1>
            )}
             {organization && <span className="hidden md:inline text-white text-lg font-semibold">{organization.name}</span>}
          </div>
          <div className="flex items-center space-x-4">
             <button
                onClick={onToggleHighContrast}
                className="p-2 rounded-full text-white hover:bg-white/20 transition-colors duration-200"
                title={isHighContrast ? "Desactivar modo de alto contraste" : "Activar modo de alto contraste"}
              >
                <EyeIcon className="h-6 w-6" />
              </button>
              
            {user && (
              <>
                <div className="flex items-center space-x-2 text-white">
                  <UserCircleIcon className="h-6 w-6"/>
                  <span className="hidden sm:inline font-medium">{`${user.primer_nombre} ${user.primer_apellido}`}</span>
                </div>
                
                {user.rol === 'Admin' && (
                   <button
                      onClick={onNavigateToSettings}
                      className="p-2 rounded-full text-white hover:bg-white/20"
                      title="Account Settings"
                    >
                      <CogIcon className="h-6 w-6" />
                    </button>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 bg-white text-brand-primary hover:bg-slate-200 font-semibold py-2 px-4 rounded-lg shadow-sm"
                  aria-label="Cerrar sesión"
                >
                  <LogOutIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};