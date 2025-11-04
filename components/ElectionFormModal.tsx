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
        permitir_voto_blanco: true,
        permitir_voto_nulo: true,
        permitir_voto_otro: true,
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
                permitir_voto_blanco: election.permitir_voto_blanco ?? true,
                permitir_voto_nulo: election.permitir_voto_nulo ?? true,
                permitir_voto_otro: election.permitir_voto_otro ?? true,
            });
        } else {
            setFormData({
                nombre: '',
                fecha_inicio: '',
                fecha_fin: '',
                estado: 'Próxima',
                resultados_publicos: false,
                descripcion: '',
                permitir_voto_blanco: true,
                permitir_voto_nulo: true,
                permitir_voto_otro: true,
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

    const CheckboxOption: React.FC<{id: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string; description: string}> = ({id, checked, onChange, label, description}) => (
         <div className="relative flex items-start">
            <div className="flex items-center h-5">
                <input id={id} name={id} type="checkbox" checked={checked} onChange={onChange}
                    className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={id} className="font-medium text-gray-700">{label}</label>
                <p className="text-gray-500">{description}</p>
            </div>
        </div>
    );

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
                     <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="text-md font-semibold px-2 text-gray-800">Opciones de Votación</legend>
                        <CheckboxOption 
                            id="permitir_voto_blanco"
                            checked={formData.permitir_voto_blanco}
                            onChange={handleChange}
                            label="Permitir Voto en Blanco"
                            description="Los votantes pueden optar por no seleccionar a ningún candidato."
                        />
                        <CheckboxOption 
                            id="permitir_voto_nulo"
                            checked={formData.permitir_voto_nulo}
                            onChange={handleChange}
                            label="Permitir Voto Nulo"
                            description="Los votantes pueden anular su voto intencionadamente."
                        />
                        <CheckboxOption 
                            id="permitir_voto_otro"
                            checked={formData.permitir_voto_otro}
                            onChange={handleChange}
                            label="Permitir Otro (Escribir)"
                            description="Los votantes pueden escribir el nombre de un candidato no listado."
                        />
                    </fieldset>
                    
                    <CheckboxOption 
                        id="resultados_publicos"
                        checked={formData.resultados_publicos}
                        onChange={handleChange}
                        label="Resultados Públicos"
                        description="Permitir que los estudiantes vean los resultados después de que la elección haya cerrado."
                    />

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