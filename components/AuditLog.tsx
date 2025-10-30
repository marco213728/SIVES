import React, { useState, useMemo } from 'react';
import { Vote, Election } from '../types';
import { SearchIcon } from './icons';

const AuditLog: React.FC<{ votes: Vote[], elections: Election[] }> = ({ votes, elections }) => {
    const [selectedElectionId, setSelectedElectionId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const electionMap = useMemo(() => {
        return elections.reduce((acc, election) => {
            acc[election.id] = election.nombre;
            return acc;
        }, {} as Record<string, string>);
    }, [elections]);

    const filteredVotes = useMemo(() => {
        return votes
            .filter(vote => {
                if (selectedElectionId === 'all') return true;
                // FIX: Compare string with string, not number.
                return vote.eleccion_id === selectedElectionId;
            })
            .filter(vote => {
                if (!searchTerm.trim()) return true;
                return vote.receipt.toLowerCase().includes(searchTerm.trim().toLowerCase());
            })
            .sort((a, b) => new Date(b.fecha_voto).getTime() - new Date(a.fecha_voto).getTime()); // Most recent first
    }, [votes, selectedElectionId, searchTerm]);
    
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Registro de Auditoría de Votos</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Election Filter */}
                <div className="flex-1">
                    <label htmlFor="election-filter" className="block text-sm font-medium text-gray-700">Filtrar por Elección</label>
                    <select
                        id="election-filter"
                        value={selectedElectionId}
                        onChange={e => setSelectedElectionId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                    >
                        <option value="all">Todas las Elecciones</option>
                        {elections.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Search by Receipt */}
                <div className="flex-1">
                     <label htmlFor="receipt-search" className="block text-sm font-medium text-gray-700">Buscar por Recibo</label>
                     <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="receipt-search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                            placeholder="Buscar recibo..."
                        />
                     </div>
                </div>
            </div>

            {/* Votes Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Voto</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elección</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVotes.length > 0 ? (
                            filteredVotes.map(vote => (
                                <tr key={vote.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vote.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{vote.receipt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{electionMap[vote.eleccion_id] || 'Desconocida'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(vote.fecha_voto)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                    No se encontraron votos que coincidan con los criterios de búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLog;
