import React from 'react';
import { User, Organization } from '../types';
import { LogOutIcon, UserCircleIcon, CogIcon } from './icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  organization: Organization | null;
  onNavigateToSettings: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


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