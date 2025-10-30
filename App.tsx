
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import LoginComponent from './components/LoginComponent';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/SettingsPage';
import { User, Election, Candidate, Vote, Organization } from './types';
import OrganizationSelector from './components/OrganizationSelector';
import * as apiService from './api/apiService';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Helper to darken a hex color for hover states
const darkenColor = (hex: string, percent: number): string => {
    // Ensure hex is valid
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
        throw new Error('Invalid hex color');
    }

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);

    const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};


const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastVoteReceipts, setLastVoteReceipts] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const warningTimeoutId = useRef<ReturnType<typeof setTimeout>>();

  // Load all data on initial mount
  useEffect(() => {
    const loadData = async () => {
        const [orgs, usrs, elects, cands, vts] = await Promise.all([
            apiService.getOrganizations(),
            apiService.getUsers(),
            apiService.getElections(),
            apiService.getCandidates(),
            apiService.getVotes()
        ]);
        setOrganizations(orgs);
        setUsers(usrs);
        setElections(elects);
        setCandidates(cands);
        setVotes(vts);
    };
    loadData();
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setShowSettings(false);
    setShowTimeoutWarning(false);
    // FIX: Pass the timeout ID to clearTimeout.
    if(timeoutId.current) clearTimeout(timeoutId.current);
    // FIX: Pass the timeout ID to clearTimeout.
    if(warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
  }, []);

  const resetTimeout = useCallback(() => {
    if(timeoutId.current) clearTimeout(timeoutId.current);
    if(warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
    setShowTimeoutWarning(false);

    if (currentUser) {
       warningTimeoutId.current = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, SESSION_TIMEOUT - 60 * 1000);

      timeoutId.current = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT);
    }
  }, [currentUser, handleLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    if (currentUser) {
      events.forEach(event => window.addEventListener(event, resetTimeout));
      resetTimeout();
    }
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
    };
  }, [currentUser, resetTimeout]);
    
  useEffect(() => {
    if (organizations.length > 0) {
        // Default to the first organization and show the login screen directly.
        setCurrentOrganization(organizations[0]);
        setOrgLoaded(true);
    }
  }, [organizations]);

  useEffect(() => {
    if (currentOrganization) {
        document.documentElement.style.setProperty('--brand-primary', currentOrganization.primaryColor);
        try {
            const darkerColor = darkenColor(currentOrganization.primaryColor, 10);
            document.documentElement.style.setProperty('--brand-primary-darker', darkerColor);
        } catch (e) {
            console.error("Failed to darken color, using fallback:", e);
            document.documentElement.style.setProperty('--brand-primary-darker', '#003366');
        }
    } else {
        document.documentElement.style.setProperty('--brand-primary', '#005A9C');
        document.documentElement.style.setProperty('--brand-primary-darker', '#004B8A');
    }
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [currentOrganization, isHighContrast]);

  const orgUsers = useMemo(() => users.filter(u => u.organizationId === currentOrganization?.id), [users, currentOrganization]);
  const orgVotes = useMemo(() => votes.filter(v => v.organizationId === currentOrganization?.id), [votes, currentOrganization]);
  
  const orgElections = useMemo(() => {
    if (!currentOrganization) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return elections
      .filter(e => e.organizationId === currentOrganization.id)
      .map(election => {
        const startDate = new Date(election.fecha_inicio);
        const endDate = new Date(election.fecha_fin);
        endDate.setHours(23, 59, 59, 999);
        let newStatus: 'Próxima' | 'Activa' | 'Cerrada';
        if (today > endDate) newStatus = 'Cerrada';
        else if (today >= startDate && today <= endDate) newStatus = 'Activa';
        else newStatus = 'Próxima';
        if (election.estado !== newStatus) return { ...election, estado: newStatus };
        return election;
      });
  }, [elections, currentOrganization]);

  const handleLogin = async (codigo: string, password?: string): Promise<boolean> => {
    if (!currentOrganization) return false;
    const user = users.find(u => u.organizationId === currentOrganization.id && u.codigo.toLowerCase() === codigo.toLowerCase());
    if (!user) return false;
    if (user.rol === 'Admin' && (!user.password || user.password !== password)) return false;
    
    setCurrentUser(user);
    if (user.rol === 'Estudiante') setLastVoteReceipts([]);
    setShowSettings(false);
    return true;
  };

  const handleVote = async (electionId: string, candidateId: string | null, isBlankVote: boolean, writeInName?: string) => {
    if (!currentUser || !currentOrganization) return;
    const { updatedVote, updatedUser } = await apiService.addVote(currentUser.id, currentOrganization.id, electionId, candidateId, writeInName);
    
    setVotes(prev => [...prev, updatedVote]);
    setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setLastVoteReceipts(prev => [...prev, updatedVote.receipt]);
  };

  const handleAddElection = async (election: Omit<Election, 'id'>) => {
    if (!currentOrganization) return;
    const newElection = await apiService.addElection(election, currentOrganization.id);
    setElections(prev => [...prev, newElection]);
  };
  const handleUpdateElection = async (election: Election) => {
    const updatedElection = await apiService.updateElection(election);
    setElections(prev => prev.map(e => e.id === updatedElection.id ? updatedElection : e));
  };
  const handleDeleteElection = async (id: string) => {
    await apiService.deleteElection(id);
    setElections(prev => prev.filter(e => e.id !== id));
  };

  const handleAddCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    const newCandidate = await apiService.addCandidate(candidate);
    setCandidates(prev => [...prev, newCandidate]);
  };
  const handleUpdateCandidate = async (candidate: Candidate) => {
    const updatedCandidate = await apiService.updateCandidate(candidate);
    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
  };
  const handleDeleteCandidate = async (id: string) => {
    await apiService.deleteCandidate(id);
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const handleAddVoter = async (voter: Omit<User, 'id' | 'ha_votado'>) => {
    if (!currentOrganization) return;
    const newVoter = await apiService.addUser(voter, currentOrganization.id);
    setUsers(prev => [...prev, newVoter]);
  };
  const handleUpdateUser = async (user: User) => {
    const updatedUser = await apiService.updateUser(user);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };
  const handleDeleteVoter = async (id: string) => {
    await apiService.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleImportVoters = async (importedVoters: Omit<User, 'id' | 'rol' | 'ha_votado'>[]) => {
    if (!currentOrganization) return;
    const newVoters = await apiService.importVoters(importedVoters, currentOrganization.id);
    setUsers(prev => [...prev, ...newVoters]);
  };

  const handleUpdateOrgSettings = async (org: Organization) => {
    const updatedOrg = await apiService.updateOrganization(org);
    setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
    setCurrentOrganization(updatedOrg);
  };

  const activeElections = useMemo(() => orgElections.filter(e => e.estado === 'Activa'), [orgElections]);
  
  const votableElectionsForCurrentUser = useMemo(() => {
      if (!currentUser || currentUser.rol !== 'Estudiante') return [];
      return activeElections.filter(e => !currentUser.ha_votado.includes(e.id));
  }, [currentUser, activeElections]);

  const renderContent = () => {
    if (!orgLoaded) return <div className="text-center py-12 text-gray-600">Loading...</div>;
    if (currentUser) {
      if (!currentOrganization) {
        handleLogout();
        return <div className="text-center py-12 text-red-500">Error: User session is invalid. Logging out.</div>;
      }
      if (currentUser.rol === 'Admin') {
        if (showSettings) {
          return <SettingsPage 
            user={currentUser}
            organization={currentOrganization}
            onUpdateUser={handleUpdateUser}
            onUpdateOrganization={handleUpdateOrgSettings}
            onNavigateToDashboard={() => setShowSettings(false)}
          />
        }
        return (
          <AdminDashboard 
            organization={currentOrganization}
            users={orgUsers}
            elections={orgElections}
            candidates={candidates}
            votes={orgVotes}
            onAddElection={handleAddElection}
            onUpdateElection={handleUpdateElection}
            onDeleteElection={handleDeleteElection}
            onAddCandidate={handleAddCandidate}
            onUpdateCandidate={handleUpdateCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            onAddVoter={handleAddVoter}
            onUpdateVoter={handleUpdateUser}
            onDeleteVoter={handleDeleteVoter}
            onImportVoters={handleImportVoters}
          />
        );
      }
      return (
        <StudentDashboard 
          user={currentUser} 
          votableElections={votableElectionsForCurrentUser}
          allActiveElections={activeElections}
          closedElectionsWithPublicResults={orgElections.filter(e => e.estado === 'Cerrada' && e.resultados_publicos)}
          candidates={candidates}
          votes={orgVotes}
          onVote={handleVote}
          lastVoteReceipts={lastVoteReceipts}
        />
      );
    } else {
      if (currentOrganization) {
        return <LoginComponent onLogin={handleLogin} organizationName={currentOrganization.name} />;
      } else {
        return <OrganizationSelector organizations={organizations} />;
      }
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {showTimeoutWarning && (
        <div className="fixed inset-x-0 top-0 z-50 bg-yellow-500 text-black text-center p-2">
          Su sesión está a punto de expirar por inactividad. Mueva el mouse o presione una tecla para continuar.
          <button onClick={resetTimeout} className="ml-4 underline font-bold">Extender Sesión</button>
        </div>
      )}
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        organization={currentOrganization} 
        onNavigateToSettings={() => setShowSettings(true)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(prev => !prev)}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
