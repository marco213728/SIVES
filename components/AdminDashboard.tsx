import React, { useState, useMemo } from 'react';
import { User, Election, Candidate, Vote, Organization } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ChartBarIcon, ClipboardListIcon, UploadIcon, UserIcon, ShieldCheckIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon, InformationCircleIcon, DownloadIcon } from './icons';
import ElectionFormModal from './ElectionFormModal';
import CandidateFormModal from './CandidateFormModal';
import VoterFormModal from './VoterFormModal';
import VoterImportModal from './VoterImportModal';
import ResultsViewer from './ResultsViewer';
import AuditLog from './AuditLog';
import ElectionOverviewModal from './ElectionOverviewModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface AdminDashboardProps {
    organization: Organization;
    users: User[];
    elections: Election[];
    candidates: Candidate[];
    votes: Vote[];
    onAddElection: (election: Omit<Election, 'id'>) => void;
    onUpdateElection: (election: Election) => void;
    onDeleteElection: (id: string) => void;
    onAddCandidate: (candidate: Omit<Candidate, 'id'>) => void;
    onUpdateCandidate: (candidate: Candidate) => void;
    onDeleteCandidate: (id: string) => void;
    onAddVoter: (voter: Omit<User, 'id' | 'ha_votado'>) => void;
    onUpdateVoter: (voter: User) => void;
    onDeleteVoter: (id: string) => void;
    onImportVoters: (voters: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[]) => void;
}

type Tab = 'results' | 'audit' | 'elections' | 'candidates' | 'voters';

const getCandidateFullName = (c: Candidate) => `${c.primer_nombre} ${c.segundo_nombre} ${c.primer_apellido} ${c.segundo_apellido}`.replace(/ +/g, ' ').trim();

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<Tab>('results');
    
    // Modal states
    const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
    const [editingElection, setEditingElection] = useState<Election | null>(null);

    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
    const [editingVoter, setEditingVoter] = useState<User | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [selectedElectionForOverview, setSelectedElectionForOverview] = useState<Election | null>(null);

    const openElectionModal = (election: Election | null = null) => {
        setEditingElection(election);
        setIsElectionModalOpen(true);
    };
    
    const openOverviewModal = (election: Election) => {
        setSelectedElectionForOverview(election);
    };

    const openCandidateModal = (candidate: Candidate | null = null) => {
        setEditingCandidate(candidate);
        setIsCandidateModalOpen(true);
    };
    
    const openVoterModal = (voter: User | null = null) => {
        setEditingVoter(voter);
        setIsVoterModalOpen(true);
    };

    const handleElectionSubmit = (electionData: Omit<Election, 'id'> | Election) => {
        if ('id' in electionData) {
            props.onUpdateElection(electionData);
        } else {
            props.onAddElection(electionData);
        }
        setIsElectionModalOpen(false);
    };

    const handleCandidateSubmit = (candidateData: Omit<Candidate, 'id'> | Candidate) => {
        if ('id' in candidateData) {
            props.onUpdateCandidate(candidateData);
        } else {
            props.onAddCandidate(candidateData);
        }
        setIsCandidateModalOpen(false);
    };
    
    const handleVoterSubmit = (voterData: Omit<User, 'id' | 'ha_votado'> | User) => {
        if ('id' in voterData) {
            props.onUpdateVoter(voterData);
        } else {
            props.onAddVoter(voterData);
        }
        setIsVoterModalOpen(false);
    };
    
    const handleImportSubmit = (voters: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[]) => {
        props.onImportVoters(voters);
        setIsImportModalOpen(false);
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'audit':
                return <AuditLog votes={props.votes} elections={props.elections} />;
            case 'elections':
                return <ManageElections elections={props.elections} openModal={openElectionModal} onDelete={props.onDeleteElection} onViewOverview={openOverviewModal} />;
            case 'candidates':
                return <ManageCandidates candidates={props.candidates} elections={props.elections} openModal={openCandidateModal} onDelete={props.onDeleteCandidate} />;
            case 'voters':
                return <ManageVoters users={props.users} openModal={openVoterModal} onDelete={props.onDeleteVoter} openImportModal={() => setIsImportModalOpen(true)} />;
            case 'results':
            default:
                return <ViewResults elections={props.elections} candidates={props.candidates} votes={props.votes} organizationName={props.organization.name} />;
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Panel de Administración</h2>
            <div className="mb-6">
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select id="tabs" name="tabs" onChange={(e) => setActiveTab(e.target.value as Tab)} value={activeTab} className="block w-full rounded-md border-gray-300 focus:border-brand-primary focus:ring-brand-primary">
                        <option value="results">Resultados</option>
                        <option value="audit">Auditoría</option>
                        <option value="elections">Elecciones</option>
                        <option value="candidates">Candidatos</option>
                        <option value="voters">Votantes</option>
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-4" aria-label="Tabs">
                            <TabButton icon={<ChartBarIcon className="h-5 w-5 mr-2" />} label="Resultados" isActive={activeTab === 'results'} onClick={() => setActiveTab('results')} />
                            <TabButton icon={<ShieldCheckIcon className="h-5 w-5 mr-2" />} label="Auditoría" isActive={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
                            <TabButton icon={<ClipboardListIcon className="h-5 w-5 mr-2" />} label="Elecciones" isActive={activeTab === 'elections'} onClick={() => setActiveTab('elections')} />
                            <TabButton icon={<UserGroupIcon className="h-5 w-5 mr-2" />} label="Candidatos" isActive={activeTab === 'candidates'} onClick={() => setActiveTab('candidates')} />
                            <TabButton icon={<UserIcon className="h-5 w-5 mr-2" />} label="Votantes" isActive={activeTab === 'voters'} onClick={() => setActiveTab('voters')} />
                        </nav>
                    </div>
                </div>
            </div>
            
            <div>{renderContent()}</div>

            <ElectionFormModal isOpen={isElectionModalOpen} onClose={() => setIsElectionModalOpen(false)} onSubmit={handleElectionSubmit} election={editingElection} />
            <CandidateFormModal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} onSubmit={handleCandidateSubmit} candidate={editingCandidate} elections={props.elections} />
            <VoterFormModal isOpen={isVoterModalOpen} onClose={() => setIsVoterModalOpen(false)} onSubmit={handleVoterSubmit} voter={editingVoter} />
            <VoterImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportSubmit} />
            <ElectionOverviewModal isOpen={!!selectedElectionForOverview} onClose={() => setSelectedElectionForOverview(null)} election={selectedElectionForOverview} organization={props.organization} />
        </div>
    );
};

// Sub-components for AdminDashboard for better organization
const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`${isActive ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}>
        {icon}
        {label}
    </button>
);

const ViewResults: React.FC<{ elections: Election[], candidates: Candidate[], votes: Vote[], organizationName: string }> = ({ elections, candidates, votes, organizationName }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            console.error("Results container not found");
            return;
        }
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(resultsContainer, { 
                scale: 2,
                useCORS: true,
                backgroundColor: '#f8fafc' // same as bg-slate-50
            });
            const imgData = canvas.toDataURL('image/png');
            
            // A4 page is 210mm x 297mm. We'll use this aspect ratio.
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasAspectRatio = canvas.width / canvas.height;
            const pdfAspectRatio = pdfWidth / pdfHeight;
            
            let imgWidth = pdfWidth;
            let imgHeight = pdfWidth / canvasAspectRatio;

            // If image is too tall for one page, we might need to split it
            // For now, let's fit it to one page.
            if(imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = pdfHeight * canvasAspectRatio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 15; // margin top

            pdf.setFontSize(10);
            pdf.text(`Reporte de Resultados - ${organizationName}`, pdfWidth / 2, 10, { align: 'center' });
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`resultados-${organizationName.toLowerCase().replace(/\s/g, '-')}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Resultados de Elecciones</h3>
                <button 
                    onClick={handleDownload}
                    disabled={isDownloading || elections.length === 0}
                    className="flex items-center bg-white text-brand-primary border border-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-slate-100 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="h-5 w-5 mr-2" /> 
                    {isDownloading ? 'Generando...' : 'Descargar Resultados'}
                </button>
            </div>
             <div id="results-container" className="space-y-8 bg-slate-50">
                {elections.length > 0 ? (
                    elections.map(e => <ResultsViewer key={e.id} election={e} candidates={candidates} votes={votes} />)
                ) : (
                    <p className="text-center text-gray-500 py-8">No hay elecciones para mostrar resultados.</p>
                )}
            </div>
        </div>
    );
};

const ManageElections: React.FC<{ elections: Election[], openModal: (e: Election | null) => void, onDelete: (id: string) => void, onViewOverview: (e: Election) => void }> = ({ elections, openModal, onDelete, onViewOverview }) => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Gestionar Elecciones</h3>
            <button onClick={() => openModal(null)} className="flex items-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker">
                <PlusIcon className="h-5 w-5 mr-2" /> Agregar Elección
            </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
                {elections.map(e => (
                    <li key={e.id} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                            <p className="text-md font-medium text-slate-800 truncate">{e.nombre}</p>
                            <p className="text-sm text-gray-500">{e.fecha_inicio} al {e.fecha_fin} - <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                e.estado === 'Activa' ? 'bg-green-100 text-green-800' : e.estado === 'Cerrada' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>{e.estado}</span></p>
                        </div>
                        <div className="space-x-1">
                            <button onClick={() => onViewOverview(e)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-blue-600" title="Ver Detalles"><InformationCircleIcon className="h-5 w-5" /></button>
                            <button onClick={() => openModal(e)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-brand-primary" title="Editar"><PencilIcon className="h-5 w-5" /></button>
                            <button onClick={() => window.confirm('¿Seguro que quiere eliminar esta elección?') && onDelete(e.id)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-red-600" title="Eliminar"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const ManageCandidates: React.FC<{ candidates: Candidate[], elections: Election[], openModal: (c: Candidate | null) => void, onDelete: (id: string) => void }> = ({ candidates, elections, openModal, onDelete }) => {
    const getElectionName = (id: string) => elections.find(e => e.id === id)?.nombre || 'Desconocida';
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Gestionar Candidatos</h3>
                <button onClick={() => openModal(null)} className="flex items-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker">
                    <PlusIcon className="h-5 w-5 mr-2" /> Agregar Candidato
                </button>
            </div>
             <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                    {candidates.map(c => (
                        <li key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center space-x-4">
                                <div className="relative h-12 w-12 flex-shrink-0">
                                    <img className="h-12 w-12 rounded-full object-cover" src={c.foto_url} alt={getCandidateFullName(c)} />
                                    {c.listLogoUrl && (
                                        <img src={c.listLogoUrl} alt={`${c.partido_politico} Logo`} className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-white" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-md font-medium text-slate-800 truncate flex items-center">
                                        {getCandidateFullName(c)}
                                        {c.listColor && <span className="ml-2 h-4 w-4 rounded-full inline-block border border-slate-300" style={{ backgroundColor: c.listColor }}></span>}
                                    </p>
                                    <p className="text-sm text-gray-500">{c.partido_politico} - {getElectionName(c.eleccion_id)}</p>
                                </div>
                            </div>
                            <div className="space-x-1">
                                <button onClick={() => openModal(c)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-brand-primary"><PencilIcon className="h-5 w-5" /></button>
                                <button onClick={() => window.confirm('¿Seguro que quiere eliminar este candidato?') && onDelete(c.id)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const getFullName = (u: User) => {
    if (u.rol === 'Admin') return `${u.primer_nombre} ${u.primer_apellido}`.trim();
    return `${u.primer_nombre} ${u.segundo_nombre} ${u.primer_apellido} ${u.segundo_apellido}`.replace(/ +/g, ' ').trim();
};

const ManageVoters: React.FC<{ users: User[], openModal: (u: User | null) => void, onDelete: (id: string) => void, openImportModal: () => void }> = ({ users, openModal, onDelete, openImportModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCurso, setFilterCurso] = useState('all');
    const [filterParalelo, setFilterParalelo] = useState('all');
    const [filterVotedStatus, setFilterVotedStatus] = useState('all');
    const [sortKey, setSortKey] = useState<'name' | 'code' | 'course'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const studentVoters = useMemo(() => users.filter(u => u.rol === 'Estudiante'), [users]);

    const uniqueCursos = useMemo(() => [...new Set(studentVoters.map(u => u.curso))].sort(), [studentVoters]);
    const uniqueParalelos = useMemo(() => [...new Set(studentVoters.map(u => u.paralelo))].sort(), [studentVoters]);

    const displayedVoters = useMemo(() => {
        let filtered = [...studentVoters];

        // Apply filters
        if (filterCurso !== 'all') {
            filtered = filtered.filter(u => u.curso === filterCurso);
        }
        if (filterParalelo !== 'all') {
            filtered = filtered.filter(u => u.paralelo === filterParalelo);
        }
        if (filterVotedStatus === 'voted') {
            filtered = filtered.filter(u => u.ha_votado.length > 0);
        } else if (filterVotedStatus === 'not-voted') {
            filtered = filtered.filter(u => u.ha_votado.length === 0);
        }

        // Apply search
        if (searchTerm.trim()) {
            const lowercasedSearch = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(u =>
                getFullName(u).toLowerCase().includes(lowercasedSearch) ||
                u.codigo.toLowerCase().includes(lowercasedSearch)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let valA: string, valB: string;
            switch (sortKey) {
                case 'code':
                    valA = a.codigo;
                    valB = b.codigo;
                    break;
                case 'course':
                    valA = `${a.curso} ${a.paralelo}`;
                    valB = `${b.curso} ${b.paralelo}`;
                    break;
                case 'name':
                default:
                    valA = getFullName(a);
                    valB = getFullName(b);
                    break;
            }
            
            if (valA.toLowerCase() < valB.toLowerCase()) return sortDirection === 'asc' ? -1 : 1;
            if (valA.toLowerCase() > valB.toLowerCase()) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;

    }, [studentVoters, searchTerm, filterCurso, filterParalelo, filterVotedStatus, sortKey, sortDirection]);

    const handleSort = (key: 'name' | 'code' | 'course') => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    return (
    <div>
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <h3 className="text-xl font-semibold w-full sm:w-auto">Gestionar Votantes</h3>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <button onClick={openImportModal} className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                    <UploadIcon className="h-5 w-5 mr-2" /> Importar
                </button>
                <button onClick={() => openModal(null)} className="flex items-center bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker">
                    <PlusIcon className="h-5 w-5 mr-2" /> Agregar Votante
                </button>
            </div>
        </div>
        
        {/* Controls */}
        <div className="bg-slate-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4 border border-slate-200">
             {/* Search */}
            <div className="flex-grow">
                <label htmlFor="voter-search" className="sr-only">Buscar</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="text" id="voter-search" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md" />
                </div>
            </div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                 <select value={filterCurso} onChange={e => setFilterCurso(e.target.value)} className="border-gray-300 rounded-md">
                    <option value="all">Todos los Cursos</option>
                    {uniqueCursos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterParalelo} onChange={e => setFilterParalelo(e.target.value)} className="border-gray-300 rounded-md">
                    <option value="all">Todos los Paralelos</option>
                    {uniqueParalelos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                 <select value={filterVotedStatus} onChange={e => setFilterVotedStatus(e.target.value)} className="border-gray-300 rounded-md">
                    <option value="all">Todos (Estado)</option>
                    <option value="voted">Ya Votaron</option>
                    <option value="not-voted">No Han Votado</option>
                </select>
            </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Sorting Headers - visible on larger screens */}
            <div className="hidden sm:flex bg-slate-50 border-b border-gray-200 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="w-2/5 flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                    Nombre
                    {sortKey === 'name' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                </div>
                <div className="w-2/5 flex items-center cursor-pointer" onClick={() => handleSort('course')}>
                    Curso y Paralelo
                    {sortKey === 'course' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                </div>
                <div className="w-1/5 flex items-center cursor-pointer" onClick={() => handleSort('code')}>
                    Código
                    {sortKey === 'code' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />)}
                </div>
                <div className="w-auto ml-auto"></div> {/* Spacer for actions */}
            </div>

            <ul className="divide-y divide-gray-200">
                {displayedVoters.length > 0 ? displayedVoters.map(u => (
                    <li key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1 min-w-0 sm:flex">
                           <div className="w-full sm:w-2/5">
                                <p className="text-md font-medium text-slate-800 truncate">{getFullName(u)}</p>
                                <p className="text-sm text-gray-500 sm:hidden">{`${u.curso}, Paralelo ${u.paralelo} - ${u.codigo}`}</p>
                           </div>
                           <div className="hidden sm:block sm:w-2/5 text-sm text-gray-500">{`${u.curso}, Paralelo ${u.paralelo}`}</div>
                           <div className="hidden sm:block sm:w-1/s text-sm text-gray-500">{u.codigo}</div>
                        </div>
                        <div className="space-x-1 flex-shrink-0 ml-4">
                            <button onClick={() => openModal(u)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-brand-primary"><PencilIcon className="h-5 w-5" /></button>
                            <button onClick={() => window.confirm('¿Seguro que quiere eliminar este votante?') && onDelete(u.id)} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                    </li>
                )) : (
                    <li className="px-6 py-12 text-center text-sm text-gray-500">
                        No se encontraron votantes que coincidan con los criterios de búsqueda.
                    </li>
                )}
            </ul>
        </div>
    </div>
    );
};

export default AdminDashboard;