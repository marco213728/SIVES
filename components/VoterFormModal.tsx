// FIX: Implement the VoterFormModal component.
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface VoterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (voter: Omit<User, 'id' | 'ha_votado'> | User) => void;
    voter: User | null;
}

// FIX: Correct the type to match the object literal. The initial form data does not include an organizationId.
const initialFormData: Omit<User, 'id' | 'ha_votado' | 'organizationId'> = {
    codigo: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    curso: '',
    paralelo: '',
    rol: 'Estudiante' as 'Estudiante',
};

const VoterFormModal: React.FC<VoterFormModalProps> = ({ isOpen, onClose, onSubmit, voter }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');

    useEffect(() => {
        if (voter) {
            setFormData({
                codigo: voter.codigo,
                primer_nombre: voter.primer_nombre,
                segundo_nombre: voter.segundo_nombre,
                primer_apellido: voter.primer_apellido,
                segundo_apellido: voter.segundo_apellido,
                curso: voter.curso,
                paralelo: voter.paralelo,
                rol: voter.rol,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [voter, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const { codigo, primer_nombre, primer_apellido, curso, paralelo, rol } = formData;
        if (rol === 'Estudiante' && (!codigo || !primer_nombre || !primer_apellido || !curso || !paralelo)) {
            setError('Para estudiantes, todos los campos excepto Segundo Nombre y Segundo Apellido son obligatorios.');
            return;
        }

        if (voter) {
            onSubmit({ ...voter, ...formData });
        } else {
            // FIX: Add a dummy organizationId to satisfy the type. It will be overwritten later.
            onSubmit({ ...formData, organizationId: '' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    {voter ? 'Editar Votante' : 'Agregar Nuevo Votante'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
                            <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
                            <select name="rol" id="rol" value={formData.rol} onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                                <option>Estudiante</option>
                                <option>Admin</option>
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="primer_nombre" className="block text-sm font-medium text-gray-700">Primer Nombre</label>
                            <input type="text" name="primer_nombre" id="primer_nombre" value={formData.primer_nombre} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="segundo_nombre" className="block text-sm font-medium text-gray-700">Segundo Nombre</label>
                            <input type="text" name="segundo_nombre" id="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="primer_apellido" className="block text-sm font-medium text-gray-700">Primer Apellido</label>
                            <input type="text" name="primer_apellido" id="primer_apellido" value={formData.primer_apellido} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="segundo_apellido" className="block text-sm font-medium text-gray-700">Segundo Apellido</label>
                            <input type="text" name="segundo_apellido" id="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="curso" className="block text-sm font-medium text-gray-700">Curso</label>
                            <input type="text" name="curso" id="curso" value={formData.curso} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Ej: Primero EGB"/>
                        </div>
                        <div>
                            <label htmlFor="paralelo" className="block text-sm font-medium text-gray-700">Paralelo</label>
                            <input type="text" name="paralelo" id="paralelo" value={formData.paralelo} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="Ej: B"/>
                        </div>
                    </div>
                    
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

export default VoterFormModal;
