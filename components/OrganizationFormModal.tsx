import React, { useState, useEffect } from 'react';
import { Organization, User } from '../types';

interface OrganizationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (orgData: Omit<Organization, 'id'> | Organization, adminData?: Omit<User, 'id'|'organizationId'|'rol'|'ha_votado'>) => void;
    organization: Organization | null;
}

const initialOrgData: Omit<Organization, 'id'> = { name: '', slug: '', primaryColor: '#0bacfa', logoUrl: null, location: '', subscriptionType: 'Free', billingType: 'None' };
const initialAdminData = { codigo: '', password: '', primer_nombre: '', primer_apellido: '', segundo_nombre: '', segundo_apellido: '', curso: 'N/A', paralelo: 'N/A' };

const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({ isOpen, onClose, onSubmit, organization }) => {
    const [orgData, setOrgData] = useState<Omit<Organization, 'id'>>(initialOrgData);
    const [adminData, setAdminData] = useState(initialAdminData);
    const [error, setError] = useState('');

    useEffect(() => {
        if (organization) {
            setOrgData({
                name: organization.name,
                slug: organization.slug,
                primaryColor: organization.primaryColor,
                logoUrl: organization.logoUrl,
                location: organization.location || '',
                subscriptionType: organization.subscriptionType || 'Free',
                billingType: organization.billingType || 'None',
            });
            // Admin editing is not part of this form when editing an org
            setAdminData(initialAdminData); 
        } else {
            setOrgData(initialOrgData);
            setAdminData(initialAdminData);
        }
    }, [organization, isOpen]);

    if (!isOpen) return null;

    const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setOrgData(prev => ({ ...prev, name: value, slug }));
        } else {
            setOrgData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAdminData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (organization) { // Editing
             if (!orgData.name) {
                setError('El nombre de la organización es obligatorio.');
                return;
            }
            onSubmit({ ...organization, ...orgData });
        } else { // Creating
            if (!orgData.name || !adminData.codigo || !adminData.password || !adminData.primer_nombre || !adminData.primer_apellido) {
                setError('Todos los campos de la organización y del administrador inicial son obligatorios.');
                return;
            }
            onSubmit(orgData, adminData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    {organization ? 'Editar Organización' : 'Crear Nueva Organización'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Organization Details */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-semibold px-2">Detalles de la Organización</legend>
                        <div className="space-y-4">
                            <input type="text" name="name" placeholder="Nombre de la Organización" value={orgData.name} onChange={handleOrgChange} className="w-full form-input" required />
                            <input type="text" name="slug" placeholder="Slug (auto-generado)" value={orgData.slug} onChange={handleOrgChange} className="w-full form-input bg-gray-100" readOnly/>
                            <input type="text" name="logoUrl" placeholder="URL del Logo (Opcional)" value={orgData.logoUrl || ''} onChange={handleOrgChange} className="w-full form-input" />
                            <input type="text" name="location" placeholder="Ubicación (Ej: Quito, Ecuador)" value={orgData.location || ''} onChange={handleOrgChange} className="w-full form-input" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-700">Tipo de Suscripción</label>
                                    <select name="subscriptionType" value={orgData.subscriptionType} onChange={handleOrgChange} className="w-full form-select mt-1">
                                        <option value="Free">Free</option>
                                        <option value="Standard">Standard</option>
                                        <option value="Premium">Premium</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="billingType" className="block text-sm font-medium text-gray-700">Tipo de Facturación</label>
                                    <select name="billingType" value={orgData.billingType} onChange={handleOrgChange} className="w-full form-select mt-1">
                                        <option value="None">None</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <label htmlFor="primaryColor" className="mr-2">Color Principal:</label>
                                <input type="color" name="primaryColor" value={orgData.primaryColor} onChange={handleOrgChange} className="form-input w-12 h-10 p-1" />
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Initial Admin Account Details */}
                     {!organization && (
                        <fieldset className="border p-4 rounded-md">
                            <legend className="text-lg font-semibold px-2">Administrador Inicial</legend>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" name="primer_nombre" placeholder="Primer Nombre Admin" value={adminData.primer_nombre} onChange={handleAdminChange} className="form-input" required />
                                    <input type="text" name="primer_apellido" placeholder="Primer Apellido Admin" value={adminData.primer_apellido} onChange={handleAdminChange} className="form-input" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" name="codigo" placeholder="Código de Usuario Admin" value={adminData.codigo} onChange={handleAdminChange} className="form-input" required />
                                    <input type="password" name="password" placeholder="Contraseña Admin" value={adminData.password} onChange={handleAdminChange} className="form-input" required />
                                </div>
                            </div>
                        </fieldset>
                    )}
                    
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-primary-darker">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrganizationFormModal;