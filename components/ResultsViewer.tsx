
import React, { useMemo, useState } from 'react';
import { Election, Candidate, Vote, ElectionResult } from '../types';
import { ShieldCheckIcon } from './icons';

interface ResultsViewerProps {
    election: Election;
    candidates: Candidate[];
    votes: Vote[];
    publishedResult?: ElectionResult | null;
    onGenerateActa?: (election: Election) => void;
    onPublishResults?: (electionId: string) => Promise<void> | void;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ 
    election, 
    candidates, 
    votes, 
    publishedResult, 
    onGenerateActa,
    onPublishResults 
}) => {
    const [isPublishing, setIsPublishing] = useState(false);
    
    const results = useMemo(() => {
        // 1. If official published result from Firestore is available, use it directly
        if (publishedResult) {
            return {
                totalVotes: publishedResult.totalVotes,
                sortedCandidates: publishedResult.sortedCandidates,
                blankVotes: publishedResult.blankVotes,
                blankPercentage: publishedResult.blankPercentage,
                sortedWriteIns: publishedResult.sortedWriteIns,
                isOfficial: true,
            };
        }

        // 2. Otherwise calculate locally from available votes
        const electionVotes = votes.filter(v => v.eleccion_id === election.id || v.electionId === election.id);
        const totalVotes = electionVotes.length;

        const candidateVotes: { [key: string]: number } = {};
        candidates.forEach(c => {
            if (c.eleccion_id === election.id || c.electionId === election.id) {
                candidateVotes[c.id] = 0;
            }
        });

        let blankVotes = 0;
        const writeInVotes: { [key: string]: number } = {};

        electionVotes.forEach(vote => {
            const cId = vote.candidateId || vote.candidato_id;
            if (cId && candidateVotes.hasOwnProperty(cId)) {
                candidateVotes[cId]++;
            } else if (vote.write_in_name) {
                const name = vote.write_in_name.trim().toLowerCase();
                writeInVotes[name] = (writeInVotes[name] || 0) + 1;
            } else {
                blankVotes++;
            }
        });
        
        const sortedCandidates = candidates
            .filter(c => c.eleccion_id === election.id || c.electionId === election.id)
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
            sortedWriteIns,
            isOfficial: false,
        };
    }, [election, candidates, votes, publishedResult]);

    const handlePublishClick = async () => {
        if (!onPublishResults) return;
        setIsPublishing(true);
        try {
            await onPublishResults(election.id);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-slate-800">{election.nombre || election.title}</h3>
                        {(election.resultados_publicos || publishedResult) && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Resultados Oficiales Publicados
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Total de votos en urna: <span className="font-bold text-slate-900">{results.totalVotes}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {onPublishResults && !election.resultados_publicos && !publishedResult && (
                        <button
                            type="button"
                            onClick={handlePublishClick}
                            disabled={isPublishing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition hover:scale-102 disabled:bg-indigo-300"
                        >
                            <span>{isPublishing ? 'Publicando...' : 'Publicar Resultados a Estudiantes'}</span>
                        </button>
                    )}
                    {onGenerateActa && (
                        <button
                            type="button"
                            onClick={() => onGenerateActa(election)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition hover:scale-102"
                        >
                            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                            <span>Emitir Acta de Escrutinio</span>
                        </button>
                    )}
                </div>
            </div>

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