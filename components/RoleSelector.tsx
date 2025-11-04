
import React from 'react';
import { UserIcon, ShieldCheckIcon } from './icons';

interface RoleSelectorProps {
    onSelectRole: (role: 'Estudiante' | 'Admin') => void;
    organizationName: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, organizationName }) => {
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        Bienvenido a SIVES
                    </h2>
                    <p className="mt-2 text-md font-medium text-gray-700">
                        {organizationName}
                    </p>
                    <p className="mt-2 text-xl text-gray-600">
                        Por favor, seleccione su rol para continuar.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RoleCard
                        title="Soy Estudiante"
                        description="Ingrese con su código único para votar."
                        icon={<UserIcon className="h-12 w-12 text-brand-primary" />}
                        onClick={() => onSelectRole('Estudiante')}
                    />
                    <RoleCard
                        title="Soy Administrador"
                        description="Ingrese con sus credenciales para gestionar las elecciones."
                        icon={<ShieldCheckIcon className="h-12 w-12 text-brand-primary" />}
                        onClick={() => onSelectRole('Admin')}
                    />
                </div>
            </div>
        </div>
    );
};

interface RoleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, description, icon, onClick }) => (
    <div
        onClick={onClick}
        className="group relative bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-brand-primary"
    >
        <div className="flex flex-col items-center text-center">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            <p className="mt-2 text-gray-600">{description}</p>
        </div>
    </div>
);

export default RoleSelector;
