import React, { useState, useRef, useEffect } from 'react';
import { User, Election, Candidate, Vote } from '../types';
import { ThumbsUpIcon, BanIcon, PencilAltIcon, DocumentDuplicateIcon, InformationCircleIcon, ChartBarIcon } from './icons';
import ResultsViewer from './ResultsViewer';

interface StudentDashboardProps {
  user: User;
  votableElections: Election[];
  allActiveElections: Election[];
  closedElectionsWithPublicResults: Election[];
  candidates: Candidate[];
  votes: Vote[];
  onVote: (electionId: string, candidateId: string | null, isBlankVote: boolean, writeInName?: string, isNullVote?: boolean) => void;
  lastVoteReceipts: string[];
}
const getCandidateFullName = (c: Candidate) => `${c.primer_nombre} ${c.segundo_nombre} ${c.primer_apellido} ${c.segundo_apellido}`.replace(/ +/g, ' ').trim();

const CandidateCard: React.FC<{ candidate: Candidate; onSelect: () => void; isSelected: boolean; }> = ({ candidate, onSelect, isSelected }) => (
  <div 
    onClick={onSelect} 
    className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 cursor-pointer ring-4 ${isSelected ? '' : 'ring-transparent'}`}
    style={{
        '--tw-ring-color': isSelected ? (candidate.listColor || 'var(--brand-primary)') : 'transparent',
      } as React.CSSProperties}
    >
    {/* Header for list information */}
    {candidate.partido_politico && candidate.listColor && (
        <div style={{ backgroundColor: candidate.listColor }} className="p-2 flex items-center space-x-3 text-white">
            {candidate.listLogoUrl && (
                <img src={candidate.listLogoUrl} alt={`${candidate.partido_politico} Logo`} className="h-10 w-10 bg-white rounded-full p-1 shadow-md object-contain" />
            )}
            <h4 className="font-bold text-lg tracking-wide uppercase" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>
                {candidate.partido_politico}
            </h4>
        </div>
    )}
    
    <div className="relative">
        {candidate.descripcion && (
            <div className="absolute top-2 right-2 group z-20">
                <InformationCircleIcon className="h-6 w-6 text-white bg-black/30 rounded-full p-1"/>
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-black text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    {candidate.descripcion}
                </div>
            </div>
        )}

        {/* Old logo display for candidates without a colored header but with a logo */}
        {candidate.listLogoUrl && !(candidate.partido_politico && candidate.listColor) && (
            <img src={candidate.listLogoUrl} alt={`${candidate.partido_politico} Logo`} className="absolute top-2 left-2 h-12 w-12 bg-white rounded-full p-1 shadow-md z-10" />
        )}
        
        <img src={candidate.foto_url} alt={getCandidateFullName(candidate)} className="w-full h-48 object-cover" />
    </div>

    <div className="p-4 text-center">
      <h3 className="text-xl font-semibold text-slate-800">{getCandidateFullName(candidate)}</h3>
    </div>
  </div>
);

const VoteOptionCard: React.FC<{ title: string; icon: React.ReactNode; onSelect: () => void; children?: React.ReactNode; isSelected?: boolean }> = ({ title, icon, onSelect, children, isSelected }) => (
  <div className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200 cursor-pointer ring-4 ${isSelected ? 'ring-brand-primary' : 'ring-transparent'}`} onClick={onSelect}>
    <div className="p-4 text-center flex flex-col items-center justify-center h-full">
      <div className="h-48 flex items-center justify-center w-full bg-slate-100 rounded-md">
        {icon}
      </div>
      <div className="p-4 text-center w-full">
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
        {children}
      </div>
    </div>
  </div>
);

const ConfirmationModal: React.FC<{ 
    selection: { type: 'candidate', data: Candidate } | { type: 'blank' } | { type: 'null' } | { type: 'write-in', name: string };
    onConfirm: () => void; 
    onCancel: () => void; 
}> = ({ selection, onConfirm, onCancel }) => {
    
    const getConfirmationText = () => {
        switch (selection.type) {
            case 'candidate':
                return <>¿Está seguro que desea votar por <span className="font-bold">{getCandidateFullName(selection.data)}</span>?</>;
            case 'blank':
                return <>¿Está seguro que desea emitir un <span className="font-bold">Voto en Blanco</span>?</>;
            case 'null':
                return <>¿Está seguro que desea emitir un <span className="font-bold">Voto Nulo</span>?</>;
            case 'write-in':
                return <>¿Está seguro que desea votar por <span className="font-bold">{selection.name}</span> (candidato escrito)?</>;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">Confirmar Voto</h2>
                <p className="text-center text-gray-700 mb-6">
                    {getConfirmationText()}
                </p>
                <p className="text-center text-sm text-red-600 mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-primary-darker">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

const DeclarationModal: React.FC<{ onAgree: () => void }> = ({ onAgree }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-xl max-w-lg w-full mx-4">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-4">Declaración del Votante</h2>
                <div className="text-gray-700 mb-6 max-h-60 overflow-y-auto text-sm space-y-2 pr-2">
                   <p>Yo, el votante, por la presente declaro bajo juramento que soy el estudiante elegible a quien se le emitió este código de votación.</p>
                   <p>Entiendo que mi voto es secreto y que estoy emitiendo mi voto de forma independiente y sin coerción.</p>
                   <p>Confirmo que solo votaré una vez en cada elección para la que soy elegible.</p>
                </div>
                <div className="flex justify-center">
                    <button onClick={onAgree} className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-primary-darker text-lg">
                        Acepto y deseo continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{step: number, totalSteps: number}> = ({ step, totalSteps }) => {
    const steps = ['Login', 'Declaración', 'Votar', 'Finalizado'];
    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex justify-between items-center">
                {steps.map((label, index) => (
                    <div key={label} className={`flex-1 text-center ${index + 1 < step ? 'text-brand-primary' : index + 1 === step ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                        <div className="text-xs sm:text-sm">{label}</div>
                    </div>
                ))}
            </div>
            <div className="bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${((step - 1.5) / (steps.length - 1)) * 100}%` }}></div>
            </div>
        </div>
    );
};

const ReceiptItem: React.FC<{receipt: string}> = ({ receipt }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(receipt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-center bg-slate-100 p-3 rounded-lg w-full">
        <code className="text-slate-800 font-mono text-md sm:text-lg break-all">{receipt}</code>
        <button onClick={handleCopyToClipboard} className="ml-4 p-2 rounded-md hover:bg-slate-200" title="Copiar recibo">
            <DocumentDuplicateIcon className="h-6 w-6 text-gray-600"/>
        </button>
        {isCopied && <p className="text-green-600 text-sm ml-2">¡Copiado!</p>}
    </div>
  );
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, votableElections, allActiveElections, closedElectionsWithPublicResults, candidates, votes, onVote, lastVoteReceipts }) => {
  const [selection, setSelection] = useState<{ type: 'candidate', data: Candidate } | { type: 'blank' } | { type: 'null' } | { type: 'write-in', name: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [writeInName, setWriteInName] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [viewingResults, setViewingResults] = useState(false);
  const writeInInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selection?.type === 'write-in') {
      writeInInputRef.current?.focus();
    }
  }, [selection]);
  
  const justFinishedVoting = votableElections.length === 0 && lastVoteReceipts.length > 0;
  const hasAlreadyVoted = votableElections.length === 0 && lastVoteReceipts.length === 0;

  if (viewingResults) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Resultados Públicos</h2>
                <button onClick={() => setViewingResults(false)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                    Volver al Dashboard
                </button>
            </div>
            <div className="space-y-8">
                {closedElectionsWithPublicResults.map(e => (
                    <ResultsViewer key={e.id} election={e} candidates={candidates} votes={votes} />
                ))}
            </div>
        </div>
    );
  }

  if ((justFinishedVoting || hasAlreadyVoted) && hasAgreed) {
    return (
      <div>
        <ProgressBar step={4} totalSteps={4} />
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-2xl mx-auto border border-slate-200">
            <ThumbsUpIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800">¡Gracias por participar!</h2>
            <p className="mt-2 text-lg text-gray-700">
            {hasAlreadyVoted 
                ? "Ya has emitido tu voto en todas las elecciones activas." 
                : "Tus votos han sido registrados exitosamente."
            }
            </p>
            {justFinishedVoting && lastVoteReceipts.length > 0 && (
                <div className="mt-6 border-t pt-6">
                    <p className="text-sm text-gray-600 mb-4">Guarde sus códigos de recibo. Son la prueba de que sus votos fueron contados.</p>
                    <div className="space-y-3">
                        {lastVoteReceipts.map((receipt, index) => (
                        <ReceiptItem key={index} receipt={receipt} />
                        ))}
                    </div>
                </div>
            )}
             {closedElectionsWithPublicResults.length > 0 && (
                <div className="mt-8 border-t pt-6">
                    <button onClick={() => setViewingResults(true)} className="flex items-center justify-center w-full bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-lg hover:bg-blue-200">
                        <ChartBarIcon className="h-5 w-5 mr-2" /> Ver Resultados de Elecciones Pasadas
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  if (!hasAgreed) {
      return (
          <>
            <ProgressBar step={2} totalSteps={4} />
            <DeclarationModal onAgree={() => setHasAgreed(true)} />
          </>
      )
  }

  const currentElection = votableElections[0];
  if (!currentElection) {
     return <div className="text-center text-gray-700 text-xl">Cargando siguiente elección...</div>;
  }
  const electionCandidates = candidates.filter(c => c.eleccion_id === currentElection.id);

  const electionsVotedCount = allActiveElections.length - votableElections.length;
  const progressStep = electionsVotedCount + 1;
  const totalSteps = allActiveElections.length;

  const handleSelect = (sel: { type: 'candidate', data: Candidate } | { type: 'blank' } | { type: 'null' } | { type: 'write-in' }) => {
    if (sel.type === 'write-in') {
        setSelection({ ...sel, name: writeInName });
    } else {
        setSelection(sel);
        setWriteInName('');
    }
  }

  const handleVoteSubmit = () => {
    if (selection?.type === 'write-in' && !writeInName.trim()) {
        alert("Por favor ingrese un nombre para el candidato.");
        return;
    }
    setShowConfirmation(true);
  }

  const handleVoteConfirm = () => {
    if (!selection) return;

    switch (selection.type) {
        case 'candidate':
            onVote(currentElection.id, selection.data.id, false, undefined, false);
            break;
        case 'blank':
            onVote(currentElection.id, null, true, undefined, false);
            break;
        case 'null':
            onVote(currentElection.id, null, false, undefined, true);
            break;
        case 'write-in':
            onVote(currentElection.id, null, false, writeInName, false);
            break;
    }
    setShowConfirmation(false);
    setSelection(null);
    setWriteInName('');
  };
  
  return (
    <div>
      <ProgressBar step={3} totalSteps={4} />
      <div className="text-center mb-10">
        <p className="text-brand-primary font-bold text-lg">Paso {progressStep} de {totalSteps}</p>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{currentElection.nombre}</h2>
        <p className="mt-2 text-lg text-gray-600">Seleccione una opción para votar.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {electionCandidates.map(candidate => (
          <CandidateCard 
            key={candidate.id} 
            candidate={candidate} 
            onSelect={() => handleSelect({ type: 'candidate', data: candidate })} 
            isSelected={selection?.type === 'candidate' && selection.data.id === candidate.id}
          />
        ))}
        {(currentElection.permitir_voto_blanco ?? true) && (
            <VoteOptionCard title="Voto en Blanco" icon={<BanIcon className="h-24 w-24 text-gray-400"/>} onSelect={() => handleSelect({type: 'blank'})} isSelected={selection?.type === 'blank'} />
        )}
        {(currentElection.permitir_voto_nulo ?? true) && (
            <VoteOptionCard title="Voto Nulo" icon={<BanIcon className="h-24 w-24 text-gray-400"/>} onSelect={() => handleSelect({type: 'null'})} isSelected={selection?.type === 'null'} />
        )}
        {(currentElection.permitir_voto_otro ?? true) && (
            <VoteOptionCard title="Otro (Escribir)" icon={<PencilAltIcon className="h-24 w-24 text-gray-400"/>} onSelect={() => handleSelect({type: 'write-in'})} isSelected={selection?.type === 'write-in'}>
                {selection?.type === 'write-in' && (
                    <input 
                        ref={writeInInputRef}
                        type="text" 
                        className="mt-2 w-full px-2 py-1 border border-gray-300 rounded-md" 
                        placeholder="Nombre del candidato" 
                        value={writeInName}
                        onChange={(e) => {
                            setWriteInName(e.target.value);
                            setSelection({ type: 'write-in', name: e.target.value });
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                )}
            </VoteOptionCard>
        )}
      </div>

      {selection && (
          <div className="text-center mt-12">
              <button onClick={handleVoteSubmit} className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-primary-darker text-xl shadow-lg">
                  Emitir Voto
              </button>
          </div>
      )}

      {showConfirmation && selection && (
        <ConfirmationModal 
          selection={selection}
          onConfirm={handleVoteConfirm}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;