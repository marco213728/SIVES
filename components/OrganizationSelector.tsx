import React from 'react';
import { Organization } from '../types';
import { OfficeBuildingIcon } from './icons';

interface OrganizationSelectorProps {
    organizations: Organization[];
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ organizations }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Bienvenido a SIVES
                </h2>
                <p className="mt-4 text-xl text-gray-600">
                    Por favor, seleccione su institución para continuar.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {organizations.map(org => (
                    <a 
                        key={org.id} 
                        href={`?org=${org.slug}`}
                        className="block bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="flex flex-col items-center text-center">
                            {org.logoUrl ? (
                                <img src={org.logoUrl} alt={`${org.name} Logo`} className="h-24 mb-4 object-contain" />
                            ) : (
                                <div className="w-24 h-24 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                    <OfficeBuildingIcon className="w-12 h-12 text-gray-500" />
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-gray-800" style={{ color: org.primaryColor }}>{org.name}</h3>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default OrganizationSelector;