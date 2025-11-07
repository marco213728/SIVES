import React, { useState, useMemo } from 'react';
import { User, Election } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface VoterParticipationReportProps {
    users: User[];
    elections: Election[];
}

const getFullName = (u: User) => `${u.primer_nombre} ${u.segundo_nombre} ${u.primer_apellido} ${u.segundo_apellido}`.replace(/ +/g, ' ').trim();

const VoterParticipationReport: React.FC<VoterParticipationReportProps> = ({ users, elections }) => {
    const [filter, setFilter] = useState<'all' | 'missing'>('all');

    const activeElections = useMemo(() => elections.filter(e => e.estado === 'Activa'), [elections]);
    const studentVoters = useMemo(() => users.filter(u => u.rol === 'Estudiante'), [users]);

    const participationData = useMemo(() => {
        return studentVoters.map(student => {
            const votesPerElection = activeElections.map(election => {
                return {
                    electionId: election.id,
                    hasVoted: student.ha_votado.includes(election.id),
                };
            });
            const missingVotes = votesPerElection.filter(v => !v.hasVoted).length;
            return {
                student,
                votesPerElection,
                missingVotes,
            };
        });
    }, [studentVoters, activeElections]);
    
    const filteredData = useMemo(() => {
        if (filter === 'missing') {
            return participationData.filter(p => p.missingVotes > 0);
        }
        return participationData;
    }, [participationData, filter]);

    const studentsWithMissingVotes = useMemo(() => participationData.filter(p => p.missingVotes > 0).length, [participationData]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Reporte de Participación de Votantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                    <p className="text-sm font-medium text-blue-800">Elecciones Activas</p>
                    <p className="text-3xl font-bold text-blue-900">{activeElections.length}</p>
                </div>
                 <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                    <p className="text-sm font-medium text-green-800">Total de Votantes</p>
                    <p className="text-3xl font-bold text-green-900">{studentVoters.length}</p>
                </div>
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <p className="text-sm font-medium text-red-800">Votantes con Votos Faltantes</p>
                    <p className="text-3xl font-bold text-red-900">{studentsWithMissingVotes}</p>
                </div>
            </div>

            <div className="mb-4">
                <fieldset className="flex items-center space-x-4">
                    <legend className="sr-only">Filtrar votantes</legend>
                    <div>
                        <input type="radio" id="filter-all" name="filter" value="all" checked={filter === 'all'} onChange={() => setFilter('all')} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary"/>
                        <label htmlFor="filter-all" className="ml-2 text-sm font-medium text-gray-700">Todos los Votantes</label>
                    </div>
                    <div>
                        <input type="radio" id="filter-missing" name="filter" value="missing" checked={filter === 'missing'} onChange={() => setFilter('missing')} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary"/>
                        <label htmlFor="filter-missing" className="ml-2 text-sm font-medium text-gray-700">Solo Votantes con Votos Faltantes</label>
                    </div>
                </fieldset>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votante</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            {activeElections.map(election => (
                                <th key={election.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{election.nombre}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map(({ student, votesPerElection }) => (
                            <tr key={student.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{getFullName(student)}</div>
                                    <div className="text-sm text-gray-500">{student.curso} '{student.paralelo}'</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{student.codigo}</td>
                                {votesPerElection.map(({ electionId, hasVoted }) => (
                                    <td key={electionId} className="px-4 py-4 whitespace-nowrap text-center">
                                        {hasVoted ? (
                                            <span className="inline-flex items-center text-green-600">
                                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                                <span className="text-sm font-medium">Votó</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-red-600">
                                                <XCircleIcon className="h-5 w-5 mr-1" />
                                                <span className="text-sm font-medium">No Votó</span>
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                         {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={2 + activeElections.length} className="px-6 py-12 text-center text-sm text-gray-500">
                                    {filter === 'missing' ? '¡Excelente! Todos los votantes han participado en todas las elecciones activas.' : 'No se encontraron votantes.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VoterParticipationReport;
