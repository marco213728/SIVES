import React, { useState, useEffect } from 'react';
import { Candidate, Election } from '../types';

interface CandidateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (candidate: Omit<Candidate, 'id'> | Candidate) => void;
    candidate: Candidate | null;
    elections: Election[];
}

const initialFormData = {
    eleccion_id: '',
    nombres: '',
    apellido: '',
    partido_politico: '',
    cargo: '',
    foto_url: '',
    descripcion: '',
};

const CandidateFormModal: React.FC<CandidateFormModalProps> = ({ isOpen, onClose, onSubmit, candidate, elections }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');

    useEffect(() => {
        if (candidate) {
            setFormData({
                eleccion_id: String(candidate.eleccion_id),
                nombres: candidate.nombres,
                apellido: candidate.apellido,
                partido_politico: candidate.partido_politico,
                cargo: candidate.cargo,
                foto_url: candidate.foto_url,
                descripcion: candidate.descripcion || '',
            });
        } else {
             // Set default election if available
            const defaultElectionId = elections.length > 0 ? String(elections[0].id) : '';
            setFormData({...initialFormData, eleccion_id: defaultElectionId });
        }
    }, [candidate, elections, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const { eleccion_id, nombres, apellido, cargo } = formData;
        if (!eleccion_id || !nombres || !apellido || !cargo) {
            setError('Elección, Nombres, Apellido y Cargo son campos obligatorios.');
            return;
        }

        const submissionData = {
            ...formData,
            eleccion_id: Number(formData.eleccion_id),
            foto_url: formData.foto_url || `https://picsum.photos/seed/${formData.nombres.toLowerCase()}/200`
        };

        if (candidate) {
            onSubmit({ ...candidate, ...submissionData });
        } else {
            onSubmit(submissionData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    {candidate ? 'Editar Candidato' : 'Crear Nuevo Candidato'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="eleccion_id" className="block text-sm font-medium text-gray-700">Elección</label>
                        <select name="eleccion_id" id="eleccion_id" value={formData.eleccion_id} onChange={handleChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                            <option value="" disabled>Seleccione una elección</option>
                            {elections.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700">Nombres</label>
                            <input type="text" name="nombres" id="nombres" value={formData.nombres} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                         <div>
                            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="apellido" id="apellido" value={formData.apellido} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="partido_politico" className="block text-sm font-medium text-gray-700">Partido Político</label>
                            <input type="text" name="partido_politico" id="partido_politico" value={formData.partido_politico} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
                            <input type="text" name="cargo" id="cargo" value={formData.cargo} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Plataforma / Descripción (Opcional)</label>
                        <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows={3}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="foto_url" className="block text-sm font-medium text-gray-700">URL de la Foto (Opcional)</label>
                        <input type="text" name="foto_url" id="foto_url" value={formData.foto_url} onChange={handleChange}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"/>
                        <p className="mt-1 text-xs text-gray-500">
                            Si se deja en blanco, se generará una imagen automáticamente usando el nombre del candidato.
                        </p>
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

export default CandidateFormModal;