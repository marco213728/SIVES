
import React, { useMemo } from 'react';
import { Election, Candidate, Vote } from '../types';

interface ResultsViewerProps {
    election: Election;
    candidates: Candidate[];
    votes: Vote[];
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ election, candidates, votes }) => {
    
    const results = useMemo(() => {
        const electionVotes = votes.filter(v => v.eleccion_id === election.id);
        const totalVotes = electionVotes.length;

        const candidateVotes: { [key: number]: number } = {};
        candidates.forEach(c => {
            if (c.eleccion_id === election.id) {
                candidateVotes[c.id] = 0;
            }
        });

        let blankVotes = 0;
        const writeInVotes: { [key: string]: number } = {};

        electionVotes.forEach(vote => {
            if (vote.candidato_id) {
                if (candidateVotes.hasOwnProperty(vote.candidato_id)) {
                    candidateVotes[vote.candidato_id]++;
                }
            } else if (vote.write_in_name) {
                const name = vote.write_in_name.trim().toLowerCase();
                writeInVotes[name] = (writeInVotes[name] || 0) + 1;
            } else {
                blankVotes++;
            }
        });
        
        const sortedCandidates = candidates
            .filter(c => c.eleccion_id === election.id)
            .map(candidate => ({
                ...candidate,
                voteCount: candidateVotes[candidate.id] || 0,
                percentage: totalVotes > 0 ? ((candidateVotes[candidate.id] || 0) / totalVotes * 100).toFixed(2) : '0.00'
            }))
            .sort((a, b) => b.voteCount - a.voteCount);

        const sortedWriteIns = Object.entries(writeInVotes)
            .map(([name, voteCount]) => ({
                name,
                voteCount,
                percentage: totalVotes > 0 ? (voteCount / totalVotes * 100).toFixed(2) : '0.00'
            }))
            .sort((a, b) => b.voteCount - a.voteCount);
            
        return {
            totalVotes,
            sortedCandidates,
            blankVotes,
            blankPercentage: totalVotes > 0 ? (blankVotes / totalVotes * 100).toFixed(2) : '0.00',
            sortedWriteIns
        };
    }, [election, candidates, votes]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{election.nombre}</h3>
            <p className="text-gray-600 mb-6">Total de votos: <span className="font-bold">{results.totalVotes}</span></p>

            {results.totalVotes === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no hay votos para esta elección.</p>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Resultados de Candidatos</h4>
                        <div className="space-y-3">
                            {results.sortedCandidates.map(candidate => (
                                <div key={candidate.id} className="w-full">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-base font-medium text-slate-800">{candidate.nombres} {candidate.apellido}</span>
                                        <span className="text-sm font-medium text-slate-800">{candidate.voteCount} votos ({candidate.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-5">
                                        <div className="bg-brand-primary h-5 rounded-full" style={{ width: `${candidate.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="border-t pt-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Otros</h4>
                         <div className="w-full">
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-gray-700">Votos en Blanco</span>
                                <span className="text-sm font-medium text-gray-700">{results.blankVotes} votos ({results.blankPercentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-5">
                                <div className="bg-slate-400 h-5 rounded-full" style={{ width: `${results.blankPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {results.sortedWriteIns.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Votos Escritos</h4>
                             <div className="space-y-3">
                                {results.sortedWriteIns.map(writeIn => (
                                    <div key={writeIn.name} className="w-full">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-base font-medium text-gray-700 capitalize">{writeIn.name}</span>
                                            <span className="text-sm font-medium text-gray-700">{writeIn.voteCount} votos ({writeIn.percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-5">
                                            <div className="bg-yellow-500 h-5 rounded-full" style={{ width: `${writeIn.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResultsViewer;