import React, { useState } from 'react';
import { Organization, User } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, OfficeBuildingIcon, UserGroupIcon, RefreshIcon } from './icons';
import OrganizationFormModal from './OrganizationFormModal';
import OrganizationMemberManager from './OrganizationMemberManager';

interface SuperAdminDashboardProps {
    organizations: Organization[];
    users: User[];
    onCreateOrgAndAdmin: (org: Omit<Organization, 'id'>, admin: Omit<User, 'id'|'organizationId'|'rol'|'ha_votado'>) => void;
    onUpdateOrganization: (org: Organization) => void;
    onAddUser: (user: Omit<User, 'id' | 'ha_votado'>, organizationId: string) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
    onImportUsers: (users: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[], organizationId: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ organizations, users, onCreateOrgAndAdmin, onUpdateOrganization, onAddUser, onUpdateUser, onDeleteUser, onImportUsers, onRefresh, isRefreshing }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [managingOrg, setManagingOrg] = useState<Organization | null>(null);


    const getAdminForOrg = (orgId: string): User | undefined => {
        return users.find(u => u.organizationId === orgId && u.rol === 'Admin');
    };
    
    const openModal = (org: Organization | null = null) => {
        setEditingOrg(org);
        setIsModalOpen(true);
    }
    
    const handleSubmit = (orgData: Omit<Organization, 'id'> | Organization, adminData?: Omit<User, 'id'|'organizationId'|'rol'|'ha_votado'>) => {
        if (editingOrg && 'id' in orgData) {
            onUpdateOrganization(orgData);
        } else if (!editingOrg && adminData && !('id' in orgData)) {
            onCreateOrgAndAdmin(orgData, adminData);
        }
        setIsModalOpen(false);
    }

    if (managingOrg) {
        return (
            <OrganizationMemberManager
                organization={managingOrg}
                users={users.filter(u => u.organizationId === managingOrg.id)}
                onClose={() => setManagingOrg(null)}
                onAddUser={(userData) => onAddUser(userData, managingOrg.id)}
                onUpdateUser={onUpdateUser}
                onDeleteUser={onDeleteUser}
                onImportUsers={onImportUsers}
            />
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Panel de Super Administrador</h2>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={onRefresh} 
                        disabled={isRefreshing} 
                        className="flex items-center bg-white text-brand-primary border border-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-slate-100 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    <button onClick={() => openModal()} className="flex items-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker">
                        <PlusIcon className="h-5 w-5 mr-2" /> Crear Organización
                    </button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {organizations.map(org => {
                        const admin = getAdminForOrg(org.id);
                        return (
                            <li key={org.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center space-x-4">
                                     <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center" style={{ backgroundColor: org.primaryColor }}>
                                        {org.logoUrl ? <img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover rounded-full" /> : <OfficeBuildingIcon className="h-6 w-6 text-white"/>}
                                    </div>
                                    <div>
                                        <p className="text-md font-medium text-slate-800 truncate">{org.name}</p>
                                        <p className="text-sm text-gray-500">Admin: {admin ? `${admin.primer_nombre} ${admin.primer_apellido}` : 'No Asignado'}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {org.location && <span className="mr-2">{org.location}</span>}
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {org.subscriptionType || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-x-1">
                                    <button onClick={() => setManagingOrg(org)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-green-600" title="Gestionar Miembros"><UserGroupIcon className="h-5 w-5" /></button>
                                    <button onClick={() => openModal(org)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-brand-primary" title="Editar"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => window.confirm('¿Seguro que quiere eliminar esta organización y todos sus datos asociados?') && console.log('delete')} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-red-600" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
            
            <OrganizationFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                organization={editingOrg}
            />
        </div>
    );
};

export default SuperAdminDashboard;