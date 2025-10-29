import React, { useState } from 'react';
import { Election, Organization } from '../types';
import { CalendarIcon, LinkIcon, DocumentDuplicateIcon } from './icons';

interface ElectionOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    election: Election | null;
    organization: Organization | null;
}

const ElectionOverviewModal: React.FC<ElectionOverviewModalProps> = ({ isOpen, onClose, election, organization }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !election || !organization) return null;

    const electionUrl = `${window.location.origin}${window.location.pathname}?org=${organization.slug}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(electionUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        // Add timezone offset to prevent date from showing as the previous day
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        return adjustedDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    const getStatusChip = () => {
        switch (election.estado) {
            case 'Activa': return 'bg-green-100 text-green-800';
            case 'Cerrada': return 'bg-red-100 text-red-800';
            case 'Próxima': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                <div className="flex items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{election.nombre}</h2>
                    <span className={`ml-4 px-3 py-1 text-sm font-semibold rounded-full ${getStatusChip()}`}>{election.estado}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="h-5 w-5 mr-2" /> Fecha de Inicio</h3>
                        <p className="text-lg font-semibold text-gray-800 mt-1">{formatDate(election.fecha_inicio)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="h-5 w-5 mr-2" /> Fecha de Fin</h3>
                        <p className="text-lg font-semibold text-gray-800 mt-1">{formatDate(election.fecha_fin)}</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-md font-semibold text-slate-800 mb-2 flex items-center"><LinkIcon className="h-5 w-5 mr-2" /> URL de Votación</h3>
                    <p className="text-xs text-gray-600 mb-3">Comparta este enlace con sus votantes para dirigirlos a la página de inicio de sesión.</p>
                    <div className="flex items-center">
                        <input type="text" readOnly value={electionUrl} className="flex-grow bg-white border border-gray-300 rounded-l-md px-3 py-2 text-sm text-gray-700 focus:outline-none" />
                        <button onClick={handleCopy} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-r-md flex items-center border-t border-r border-b border-gray-300">
                            <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                            {copied ? '¡Copiado!' : 'Copiar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElectionOverviewModal;