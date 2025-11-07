import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import LoginComponent from './components/LoginComponent';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/SettingsPage';
import { User, Election, Candidate, Vote, Organization } from './types';
import * as apiService from './api/apiService';
import SuperAdminDashboard from './components/SuperAdminDashboard';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const darkenColor = (hex: string, percent: number): string => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#003366'; // Fallback for invalid hex
    let r = parseInt(hex.substring(1, 3), 16),
        g = parseInt(hex.substring(3, 5), 16),
        b = parseInt(hex.substring(5, 7), 16);
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastVoteReceipts, setLastVoteReceipts] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const [orgs, usrs] = await Promise.all([
                apiService.getOrganizations(),
                apiService.getUsers(),
            ]);
            setOrganizations(orgs);
            setUsers(usrs);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setLoading(false);
        }
    };
    loadInitialData();
  }, []);
  
  const loadOrgSpecificData = useCallback(async (orgId: string) => {
    const [elects, cands, vts] = await Promise.all([
        apiService.getElections(orgId),
        apiService.getCandidates(orgId),
        apiService.getVotes(orgId)
    ]);
    setElections(elects);
    setCandidates(cands);
    setVotes(vts);
  }, []);

  const handleLogout = useCallback(() => {
    // Clear session timers first to prevent them from firing after logout
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);

    // Reset all application state
    setCurrentUser(null);
    setCurrentOrganization(null);
    setElections([]);
    setCandidates([]);
    setVotes([]);
    setShowSettings(false);
    setShowTimeoutWarning(false);
  }, []);

  const resetTimeout = useCallback(() => {
    if(timeoutId.current) clearTimeout(timeoutId.current);
    if(warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
    setShowTimeoutWarning(false);
    if (currentUser) {
       warningTimeoutId.current = setTimeout(() => setShowTimeoutWarning(true), SESSION_TIMEOUT - 60 * 1000);
       timeoutId.current = setTimeout(() => handleLogout(), SESSION_TIMEOUT);
    }
  }, [currentUser, handleLogout]);
  
  const refreshData = useCallback(async () => {
    if (!currentUser) return;

    setIsRefreshing(true);
    try {
        if (currentUser.rol === 'SuperAdmin') {
            const [orgs, usrs] = await Promise.all([
                apiService.getOrganizations(),
                apiService.getUsers(),
            ]);
            setOrganizations(orgs);
            setUsers(usrs);
        } else if (currentUser.rol === 'Admin' && currentOrganization) {
            const [usrs, elects, cands, vts] = await Promise.all([
                apiService.getUsers(),
                apiService.getElections(currentOrganization.id),
                apiService.getCandidates(currentOrganization.id),
                apiService.getVotes(currentOrganization.id)
            ]);
            setUsers(usrs);
            setElections(elects);
            setCandidates(cands);
            setVotes(vts);
        }
    } catch (error) {
        console.error("Failed to refresh data:", error);
        alert("Ocurrió un error al actualizar los datos.");
    } finally {
        setIsRefreshing(false);
    }
  }, [currentUser, currentOrganization]);

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
    if (currentOrganization) {
        document.documentElement.style.setProperty('--brand-primary', currentOrganization.primaryColor);
        document.documentElement.style.setProperty('--brand-primary-darker', darkenColor(currentOrganization.primaryColor, 10));
    } else {
        document.documentElement.style.setProperty('--brand-primary', '#005A9C');
        document.documentElement.style.setProperty('--brand-primary-darker', '#004B8A');
    }
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [currentOrganization, isHighContrast]);

  const orgUsers = useMemo(() => users.filter(u => u.organizationId === currentOrganization?.id), [users, currentOrganization]);
  
  const orgElections = useMemo(() => {
    if (!currentOrganization) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return elections.map(election => {
        const startDate = new Date(election.fecha_inicio);
        const endDate = new Date(election.fecha_fin);
        endDate.setHours(23, 59, 59, 999);
        let newStatus: 'Próxima' | 'Activa' | 'Cerrada' = election.estado;
        if (today > endDate) newStatus = 'Cerrada';
        else if (today >= startDate && today <= endDate) newStatus = 'Activa';
        else newStatus = 'Próxima';
        if (election.estado !== newStatus) return { ...election, estado: newStatus };
        return election;
      });
  }, [elections, currentOrganization]);

  const handleLogin = async (codigo: string, password?: string): Promise<boolean> => {
    const lowerCaseCodigo = codigo.toLowerCase();
    
    // 1. Check for SuperAdmin (global)
    const superAdmin = users.find(u => u.rol === 'SuperAdmin' && u.codigo.toLowerCase() === lowerCaseCodigo);
    if (superAdmin) {
        if (!password || superAdmin.password !== password) return false;
        setCurrentUser(superAdmin);
        setCurrentOrganization(null);
        return true;
    }

    // 2. Check for Admin or Student
    const user = users.find(u => u.codigo.toLowerCase() === lowerCaseCodigo && u.rol !== 'SuperAdmin');
    if (!user) return false; // User not found

    // 3. Validate credentials
    if (user.rol === 'Admin') {
      if (!password || user.password !== password) return false;
    }
    
    // 4. Find and set organization
    if (user.organizationId) {
        const organization = organizations.find(o => o.id === user.organizationId);
        if (!organization) {
            console.error(`Organization not found for user ${user.id}`);
            return false; // Org not found for user, login fails.
        }
        setCurrentOrganization(organization);
        await loadOrgSpecificData(organization.id);
    } else {
        console.error(`User ${user.id} has no organizationId`);
        return false;
    }

    // 5. Set user and finish
    setCurrentUser(user);
    if (user.rol === 'Estudiante') setLastVoteReceipts([]);
    setShowSettings(false);
    return true;
  };

  const handleVote = async (electionId: string, candidateId: string | null, isBlankVote: boolean, writeInName?: string, isNullVote?: boolean) => {
    if (!currentUser || !currentOrganization) return;
    try {
      const { updatedVote, updatedUser } = await apiService.addVote(currentUser.id, currentOrganization.id, electionId, candidateId, writeInName, isNullVote);
      setVotes(prev => [...prev, updatedVote]);
      setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setLastVoteReceipts(prev => [...prev, updatedVote.receipt]);
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert(`Ocurrió un error al registrar su voto: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleCreateOrgAndAdmin = async (org: Omit<Organization, 'id'>, admin: Omit<User, 'id' | 'organizationId' | 'rol' | 'ha_votado'>) => {
      try {
        const { newOrg, newAdmin } = await apiService.createOrganizationAndAdmin(org, admin);
        setOrganizations(prev => [...prev, newOrg]);
        setUsers(prev => [...prev, newAdmin]);
      } catch (error) {
        console.error("Error creating organization and admin:", error);
        alert(`Ocurrió un error al crear la organización: ${error instanceof Error ? error.message : String(error)}`);
      }
  };
  
  const handleDeleteOrganization = async (id: string) => {
    try {
        await apiService.deleteOrganizationAndData(id);
        setOrganizations(prev => prev.filter(o => o.id !== id));
        setUsers(prev => prev.filter(u => u.organizationId !== id));
    } catch (error) {
        console.error("Error deleting organization:", error);
        alert(`Ocurrió un error al eliminar la organización: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Admin operations
  const handleAddElection = async (electionData: Omit<Election, 'id'>) => {
    if (!currentOrganization) return;
    try {
        const newElection = await apiService.addElection(electionData, currentOrganization.id);
        setElections(prev => [...prev, newElection]);
    } catch (error) {
        console.error("Error adding election:", error);
        alert(`Ocurrió un error al agregar la elección: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateElection = async (electionData: Election) => {
    try {
        const updatedElection = await apiService.updateElection(electionData);
        setElections(prev => prev.map(e => e.id === updatedElection.id ? updatedElection : e));
    } catch (error) {
        console.error("Error updating election:", error);
        alert(`Ocurrió un error al actualizar la elección: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteElection = async (id: string) => {
    try {
        await apiService.deleteElection(id);
        setElections(prev => prev.filter(e => e.id !== id));
    } catch (error) {
        console.error("Error deleting election:", error);
        alert(`Ocurrió un error al eliminar la elección: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAddCandidate = async (candidateData: Omit<Candidate, 'id'>) => {
    try {
        const newCandidate = await apiService.addCandidate(candidateData);
        setCandidates(prev => [...prev, newCandidate]);
    } catch (error) {
        console.error("Error adding candidate:", error);
        alert(`Ocurrió un error al agregar el candidato: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateCandidate = async (candidateData: Candidate) => {
    try {
        const updatedCandidate = await apiService.updateCandidate(candidateData);
        setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    } catch (error) {
        console.error("Error updating candidate:", error);
        alert(`Ocurrió un error al actualizar el candidato: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
        await apiService.deleteCandidate(id);
        setCandidates(prev => prev.filter(c => c.id !== id));
    } catch (error) {
        console.error("Error deleting candidate:", error);
        alert(`Ocurrió un error al eliminar el candidato: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAddUser = async (userData: Omit<User, 'id' | 'ha_votado'>, organizationId: string) => {
    try {
        const newUser = await apiService.addUser(userData, organizationId);
        setUsers(prev => [...prev, newUser]);
    } catch (error) {
        console.error("Error adding user:", error);
        alert(`Ocurrió un error al agregar el usuario: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateUser = async (voterData: User) => {
    try {
        const updatedUser = await apiService.updateUser(voterData);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (error) {
        console.error("Error updating user:", error);
        alert(`Ocurrió un error al actualizar el usuario: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
        await apiService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        setVotes(prev => prev.filter(v => v.user_id !== id));
    } catch (error) {
        console.error("Error deleting user:", error);
        alert(`Ocurrió un error al eliminar el usuario: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportUsers = async (votersData: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[], organizationId: string) => {
    try {
      const newUsers = await apiService.importVoters(votersData, organizationId);
      setUsers(prev => [...prev, ...newUsers]);
    } catch (error) {
        console.error("Failed to import voters:", error);
        alert(`Error al importar votantes: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Settings operations
  const handleUpdateOrganization = async (orgData: Organization) => {
    try {
        const updatedOrg = await apiService.updateOrganization(orgData);
        setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
        if (currentOrganization?.id === updatedOrg.id) {
          setCurrentOrganization(updatedOrg);
        }
    } catch (error) {
        console.error("Error updating organization settings:", error);
        alert(`Ocurrió un error al actualizar la configuración: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateCurrentUser = async (userData: User) => {
    try {
        const updatedUser = await apiService.updateUser(userData);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
    } catch (error) {
        console.error("Error updating current user:", error);
        alert(`Ocurrió un error al actualizar su perfil: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
    try {
        await apiService.updateUserPassword(userId, currentPassword, newPassword);
        // We also need to update the password in the local state for the current session
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
            const userWithNewPass = {...updatedUser, password: newPassword};
            setUsers(prev => prev.map(u => u.id === userId ? userWithNewPass : u));
            if (currentUser?.id === userId) {
                setCurrentUser(userWithNewPass);
            }
        }
        alert("Contraseña actualizada con éxito.");
    } catch (error) {
        console.error("Error updating password:", error);
        alert(`Ocurrió un error al actualizar la contraseña: ${error instanceof Error ? error.message : String(error)}`);
        throw error; // re-throw to let the component know it failed
    }
  };

  const activeElections = useMemo(() => orgElections.filter(e => e.estado === 'Activa'), [orgElections]);
  const votableElectionsForCurrentUser = useMemo(() => {
      if (!currentUser || currentUser.rol !== 'Estudiante') return [];
      return activeElections.filter(e => !currentUser.ha_votado.includes(e.id));
  }, [currentUser, activeElections]);

  const renderContent = () => {
    if (loading) return <div className="text-center py-12 text-gray-600">Loading...</div>;
    
    if (currentUser) {
        if (currentUser.rol === 'SuperAdmin') {
            return <SuperAdminDashboard 
                organizations={organizations}
                users={users}
                onCreateOrgAndAdmin={handleCreateOrgAndAdmin}
                onUpdateOrganization={handleUpdateOrganization}
                onDeleteOrganization={handleDeleteOrganization}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onImportUsers={handleImportUsers}
                onRefresh={refreshData}
                isRefreshing={isRefreshing}
            />;
        }

        if (!currentOrganization) {
            handleLogout();
            return <div className="text-center py-12 text-red-500">Error: User session is invalid. Logging out.</div>;
        }

        if (currentUser.rol === 'Admin') {
          if (showSettings) {
            return <SettingsPage user={currentUser} organization={currentOrganization} onUpdateUser={handleUpdateCurrentUser} onUpdateOrganization={handleUpdateOrganization} onNavigateToDashboard={() => setShowSettings(false)} onUpdateUserPassword={handleUpdateUserPassword} />
          }
          return <AdminDashboard 
            organization={currentOrganization} 
            users={orgUsers} 
            elections={orgElections} 
            candidates={candidates} 
            votes={votes} 
            onAddElection={handleAddElection} 
            onUpdateElection={handleUpdateElection} 
            onDeleteElection={handleDeleteElection} 
            onAddCandidate={handleAddCandidate} 
            onUpdateCandidate={handleUpdateCandidate} 
            onDeleteCandidate={handleDeleteCandidate} 
            onAddVoter={(voterData) => handleAddUser(voterData, currentOrganization.id)} 
            onUpdateVoter={handleUpdateUser} 
            onDeleteVoter={handleDeleteUser} 
            onImportVoters={(voterData) => handleImportUsers(voterData, currentOrganization.id)}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
          />;
        }

        if (currentUser.rol === 'Estudiante') {
          return <StudentDashboard user={currentUser} votableElections={votableElectionsForCurrentUser} allActiveElections={activeElections} closedElectionsWithPublicResults={orgElections.filter(e => e.estado === 'Cerrada' && e.resultados_publicos)} candidates={candidates} votes={votes} onVote={handleVote} lastVoteReceipts={lastVoteReceipts} />;
        }

        return null;
    }

    return <LoginComponent onLogin={handleLogin} />;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {showTimeoutWarning && (
        <div className="fixed inset-x-0 top-0 z-50 bg-yellow-500 text-black text-center p-2">
          Su sesión está a punto de expirar por inactividad. Mueva el mouse o presione una tecla para continuar.
          <button onClick={resetTimeout} className="ml-4 underline font-bold">Extender Sesión</button>
        </div>
      )}
      <Header user={currentUser} onLogout={handleLogout} organization={currentOrganization} onNavigateToSettings={() => setShowSettings(true)} isHighContrast={isHighContrast} onToggleHighContrast={() => setIsHighContrast(prev => !prev)} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
