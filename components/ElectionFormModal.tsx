import React, { useState, useEffect } from 'react';
import { Election } from '../types';

interface ElectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (election: Omit<Election, 'id'> | Election) => void;
    election: Election | null;
}

const ElectionFormModal: React.FC<ElectionFormModalProps> = ({ isOpen, onClose, onSubmit, election }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'Próxima' as 'Activa' | 'Cerrada' | 'Próxima',
        resultados_publicos: false,
        descripcion: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (election) {
            setFormData({
                nombre: election.nombre,
                fecha_inicio: election.fecha_inicio,
                fecha_fin: election.fecha_fin,
                estado: election.estado,
                resultados_publicos: election.resultados_publicos,
                descripcion: election.descripcion || '',
            });
        } else {
            setFormData({
                nombre: '',
                fecha_inicio: '',
                fecha_fin: '',
                estado: 'Próxima',
                resultados_publicos: false,
                descripcion: '',
            });
        }
    }, [election, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        if (formData.fecha_inicio > formData.fecha_fin) {
            setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }
        
        if (election) {
            onSubmit({ ...election, ...formData });
        } else {
            // FIX: Add a dummy organizationId to satisfy the type. It will be overwritten later.
            onSubmit({ ...formData, organizationId: '' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    {election ? 'Editar Elección' : 'Crear Nueva Elección'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Elección</label>
                        <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                     <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción / Reglas (Opcional)</label>
                        <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows={3}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                            <input type="date" name="fecha_inicio" id="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                            <input type="date" name="fecha_fin" id="fecha_fin" value={formData.fecha_fin} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                        <select name="estado" id="estado" value={formData.estado} onChange={handleChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                            <option>Próxima</option>
                            <option>Activa</option>
                            <option>Cerrada</option>
                        </select>
                    </div>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input id="resultados_publicos" name="resultados_publicos" type="checkbox" checked={formData.resultados_publicos} onChange={handleChange}
                                className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="resultados_publicos" className="font-medium text-gray-700">Resultados Públicos</label>
                            <p className="text-gray-500">Permitir que los estudiantes vean los resultados después de que la elección haya cerrado.</p>
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

export default ElectionFormModal;
