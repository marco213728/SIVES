import React, { useState, useMemo } from 'react';
import { User, Organization } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import VoterFormModal from './VoterFormModal';
import VoterImportModal from './VoterImportModal';


interface OrganizationMemberManagerProps {
    organization: Organization;
    users: User[];
    onClose: () => void;
    onAddUser: (user: Omit<User, 'id' | 'ha_votado'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
    onImportUsers: (users: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[], organizationId: string) => void;
}

const getFullName = (u: User) => {
    if (u.rol === 'Admin') return `${u.primer_nombre} ${u.primer_apellido}`.trim();
    return `${u.primer_nombre} ${u.segundo_nombre} ${u.primer_apellido} ${u.segundo_apellido}`.replace(/ +/g, ' ').trim();
};


const OrganizationMemberManager: React.FC<OrganizationMemberManagerProps> = ({
    organization,
    users,
    onClose,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onImportUsers
}) => {
    const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
    const [editingVoter, setEditingVoter] = useState<User | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [sortKey, setSortKey] = useState<'name' | 'code' | 'role'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const openVoterModal = (voter: User | null = null) => {
        setEditingVoter(voter);
        setIsVoterModalOpen(true);
    };

    const handleVoterSubmit = (voterData: Omit<User, 'id' | 'ha_votado'> | User) => {
        if ('id' in voterData) {
            onUpdateUser(voterData);
        } else {
            onAddUser(voterData);
        }
        setIsVoterModalOpen(false);
    };
    
    const handleImportSubmit = (voters: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[]) => {
        onImportUsers(voters, organization.id);
        setIsImportModalOpen(false);
    }

    const displayedUsers = useMemo(() => {
        let filtered = [...users];

        if (filterRole !== 'all') {
            filtered = filtered.filter(u => u.rol === filterRole);
        }

        if (searchTerm.trim()) {
            const lowercasedSearch = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(u =>
                getFullName(u).toLowerCase().includes(lowercasedSearch) ||
                u.codigo.toLowerCase().includes(lowercasedSearch)
            );
        }

        filtered.sort((a, b) => {
            let valA: string, valB: string;
            switch (sortKey) {
                case 'code':
                    valA = a.codigo;
                    valB = b.codigo;
                    break;
                case 'role':
                    valA = a.rol;
                    valB = b.rol;
                    break;
                case 'name':
                default:
                    valA = getFullName(a);
                    valB = getFullName(b);
                    break;
            }
            
            if (valA.toLowerCase() < valB.toLowerCase()) return sortDirection === 'asc' ? -1 : 1;
            if (valA.toLowerCase() > valB.toLowerCase()) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [users, searchTerm, filterRole, sortKey, sortDirection]);

    const handleSort = (key: 'name' | 'code' | 'role') => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    return (
        <div>
            <div className="flex-wrap justify-between items-center mb-4">
                <button onClick={onClose} className="text-sm text-brand-primary hover:underline mb-2">&larr; Volver a Organizaciones</button>
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-slate-800">Gestionar Miembros: {organization.name}</h2>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                            <UploadIcon className="h-5 w-5 mr-2" /> Importar
                        </button>
                        <button onClick={() => openVoterModal(null)} className="flex items-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker">
                            <PlusIcon className="h-5 w-5 mr-2" /> Agregar Miembro
                        </button>
                    </div>
                </div>
            </div>

             <div className="bg-slate-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 border border-slate-200">
                <div className="flex-grow">
                    <label htmlFor="voter-search" className="sr-only">Buscar</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" id="voter-search" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                     <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border-gray-300 rounded-md">
                        <option value="all">Todos los Roles</option>
                        <option value="Estudiante">Estudiante</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="hidden sm:flex bg-slate-50 border-b border-gray-200 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="w-2/5 flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                        Nombre
                        {sortKey === 'name' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                    </div>
                    <div className="w-1/5 flex items-center cursor-pointer" onClick={() => handleSort('role')}>
                        Rol
                        {sortKey === 'role' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                    </div>
                    <div className="w-2/5 flex items-center cursor-pointer" onClick={() => handleSort('code')}>
                        Código
                        {sortKey === 'code' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                    </div>
                    <div className="w-auto ml-auto"></div>
                </div>

                <ul className="divide-y divide-gray-200">
                    {displayedUsers.map(u => (
                        <li key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex-1 min-w-0 sm:flex">
                               <div className="w-full sm:w-2/5">
                                    <p className="text-md font-medium text-slate-800 truncate">{getFullName(u)}</p>
                                    <p className="text-sm text-gray-500 sm:hidden">{`${u.rol} - ${u.codigo}`}</p>
                               </div>
                               <div className="hidden sm:block sm:w-1/5 text-sm text-gray-500">
                                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {u.rol}
                                   </span>
                               </div>
                               <div className="hidden sm:block sm:w-2/5 text-sm text-gray-500">{u.codigo}</div>
                            </div>
                            <div className="space-x-1 flex-shrink-0 ml-4">
                                <button onClick={() => openVoterModal(u)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-brand-primary"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => window.confirm('¿Seguro que quiere eliminar este usuario?') && onDeleteUser(u.id)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            <VoterFormModal isOpen={isVoterModalOpen} onClose={() => setIsVoterModalOpen(false)} onSubmit={handleVoterSubmit} voter={editingVoter} />
            <VoterImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportSubmit} />
        </div>
    );
};

export default OrganizationMemberManager;