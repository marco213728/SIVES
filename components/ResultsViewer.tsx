import React, { useMemo } from 'react';
import { Election, Candidate, Vote } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ResultsViewerProps {
    election: Election;
    candidates: Candidate[];
    votes: Vote[];
}
const getCandidateFullName = (c: Candidate) => `${c.primer_nombre} ${c.segundo_nombre} ${c.primer_apellido} ${c.segundo_apellido}`.replace(/ +/g, ' ').trim();

const BASE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'];
const OTHER_VOTE_COLORS: {[key: string]: string} = {
    'Votos en Blanco': '#a0aec0',
    'Votos Nulos': '#f56565',
    'Votos Escritos': '#ecc94b',
};

const ResultsViewer: React.FC<ResultsViewerProps> = ({ election, candidates, votes }) => {
    
    const { results, pieData } = useMemo(() => {
        const electionVotes = votes.filter(v => v.eleccion_id === election.id);
        const totalVotes = electionVotes.length;

        const candidateVotes: { [key: string]: number } = {};
        candidates.forEach(c => {
            if (c.eleccion_id === election.id) {
                candidateVotes[c.id] = 0;
            }
        });

        let blankVotes = 0;
        let nullVotes = 0;
        const writeInVotes: { [key: string]: number } = {};

        electionVotes.forEach(vote => {
            if (vote.candidato_id) {
                if (candidateVotes.hasOwnProperty(vote.candidato_id)) {
                    candidateVotes[vote.candidato_id]++;
                }
            } else if (vote.write_in_name) {
                const name = vote.write_in_name.trim().toLowerCase();
                writeInVotes[name] = (writeInVotes[name] || 0) + 1;
            } else if (vote.is_null_vote) {
                nullVotes++;
            }
            else {
                blankVotes++;
            }
        });
        
        const sortedCandidates = candidates
            .filter(c => c.eleccion_id === election.id)
            .map(candidate => ({
                ...candidate,
                voteCount: candidateVotes[candidate.id] || 0,
                percentage: totalVotes > 0 ? ((candidateVotes[candidate.id] || 0) / totalVotes * 100) : 0
            }))
            .sort((a, b) => b.voteCount - a.voteCount);

        const sortedWriteIns = Object.entries(writeInVotes)
            .map(([name, voteCount]) => ({
                name,
                voteCount,
                percentage: totalVotes > 0 ? (voteCount / totalVotes * 100) : 0
            }))
            .sort((a, b) => b.voteCount - a.voteCount);
        
        const otherVotes = [
            { name: 'Votos en Blanco', voteCount: blankVotes, percentage: totalVotes > 0 ? (blankVotes / totalVotes * 100) : 0 },
            { name: 'Votos Nulos', voteCount: nullVotes, percentage: totalVotes > 0 ? (nullVotes / totalVotes * 100) : 0 },
            ...sortedWriteIns.map(wi => ({ name: `Escrito: ${wi.name}`, voteCount: wi.voteCount, percentage: wi.percentage }))
        ].filter(v => v.voteCount > 0);

        // Prepare data for Pie Chart
        const currentPieData = [
            ...sortedCandidates.map((c, index) => ({
                name: getCandidateFullName(c),
                value: c.voteCount,
                color: c.listColor || BASE_COLORS[index % BASE_COLORS.length]
            })),
            ...otherVotes.map((v, index) => ({
                name: v.name,
                value: v.voteCount,
                color: OTHER_VOTE_COLORS[v.name.startsWith('Escrito') ? 'Votos Escritos' : v.name] || BASE_COLORS[(sortedCandidates.length + index) % BASE_COLORS.length]
            }))
        ].filter(d => d.value > 0);

        return {
            results: {
                totalVotes,
                sortedCandidates,
                otherVotes,
            },
            pieData: currentPieData
        };
    }, [election, candidates, votes]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = ((data.value / results.totalVotes) * 100).toFixed(2);
            return (
                <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                    <p className="font-bold">{`${data.payload.name}`}</p>
                    <p>{`Votos: ${data.value} (${percentage}%)`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">{election.nombre}</h3>
                    <p className="text-gray-600">Total de votos: <span className="font-bold">{results.totalVotes}</span></p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    election.estado === 'Activa' ? 'bg-green-100 text-green-800' : election.estado === 'Cerrada' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>{election.estado}</span>
            </div>
            
            {results.totalVotes === 0 ? (
                <p className="text-center text-gray-500 py-8">Aún no hay votos para esta elección.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="divide-y divide-slate-200">
                        {results.sortedCandidates.map((candidate, index) => (
                            <div key={candidate.id} className="py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 flex items-center -space-x-3">
                                        <img src={candidate.foto_url} alt={getCandidateFullName(candidate)} className="h-12 w-12 rounded-full object-cover ring-2 ring-white z-10" />
                                        {candidate.listLogoUrl && (
                                            <div className="h-12 w-12 rounded-full ring-2 ring-white bg-white flex items-center justify-center p-1">
                                                <img src={candidate.listLogoUrl} alt={`${candidate.partido_politico} Logo`} className="h-full w-full object-contain" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{getCandidateFullName(candidate)}</p>
                                        <p className="text-sm text-gray-500 truncate">{candidate.partido_politico}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <p className="font-bold text-slate-700">{candidate.voteCount} votos</p>
                                        <p className="text-sm text-gray-500">{candidate.percentage.toFixed(2)}%</p>
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${candidate.percentage}%`, backgroundColor: pieData.find(p => p.name === getCandidateFullName(candidate))?.color || BASE_COLORS[index % BASE_COLORS.length] }}></div>
                                </div>
                            </div>
                        ))}

                        {results.otherVotes.length > 0 && (
                            <div className="pt-4 space-y-3">
                                {results.otherVotes.map((voteType, index) => (
                                    <div key={voteType.name}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-base font-medium text-slate-700 flex items-center">
                                                <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: pieData.find(p => p.name === voteType.name)?.color || '#ccc'}}></span>
                                                {voteType.name}
                                            </span>
                                            <span className="text-sm font-medium text-slate-600">{voteType.voteCount} votos ({voteType.percentage.toFixed(2)}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div className="h-2 rounded-full" style={{ width: `${voteType.percentage}%`, backgroundColor: pieData.find(p => p.name === voteType.name)?.color || '#ccc' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full h-64 md:h-80">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsViewer;
