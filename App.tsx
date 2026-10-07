import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import LoginComponent, { LoginCredentials } from './components/LoginComponent';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/SettingsPage';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import { User, Election, Candidate, Vote, Organization } from './types';
import * as apiService from './api/apiService';
import { SwitchHorizontalIcon } from './components/icons';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const darkenColor = (hex: string, percent: number): string => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    return '#003366';
  }

  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.floor((r * (100 - percent)) / 100);
  g = Math.floor((g * (100 - percent)) / 100);
  b = Math.floor((b * (100 - percent)) / 100);

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
  const [inspectingOrg, setInspectingOrg] = useState<Organization | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastVoteReceipts, setLastVoteReceipts] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningTimeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSelectOrganization = useCallback((org: Organization) => {
    setCurrentOrganization(org);
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('org', org.slug || org.id);
      window.history.replaceState({}, '', currentUrl.toString());
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [orgs, usrs, elects, cands, vts] = await Promise.all([
        apiService.getOrganizations(),
        apiService.getUsers(),
        apiService.getElections(),
        apiService.getCandidates(),
        apiService.getVotes(),
      ]);

      const dedupe = <T extends { id: string }>(items: T[]): T[] => {
        const seen = new Set<string>();
        return items.filter((item) => {
          if (!item?.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      };

      setOrganizations(dedupe(orgs));
      setUsers(dedupe(usrs));
      setElections(dedupe(elects));
      setCandidates(dedupe(cands));
      setVotes(dedupe(vts));

      if (orgs.length > 0) {
        // Read ?org= parameter from URL if provided
        const urlParams = new URLSearchParams(window.location.search);
        const orgParam = urlParams.get('org');
        let targetOrg: Organization | undefined;

        if (orgParam) {
          const searchKey = orgParam.toLowerCase().trim();
          targetOrg = orgs.find(
            (o) =>
              o.slug?.toLowerCase() === searchKey ||
              o.id?.toLowerCase() === searchKey ||
              o.code?.toLowerCase() === searchKey
          );
        }

        if (!targetOrg && currentOrganization) {
          targetOrg = orgs.find((o) => o.id === currentOrganization.id) || currentOrganization;
        }

        if (!targetOrg) {
          targetOrg = orgs.find((o) => o.status === 'ACTIVE') || orgs[0];
        }

        setCurrentOrganization(targetOrg);

        // Keep URL in sync
        if (targetOrg && targetOrg.slug) {
          try {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.get('org') !== targetOrg.slug) {
              currentUrl.searchParams.set('org', targetOrg.slug);
              window.history.replaceState({}, '', currentUrl.toString());
            }
          } catch {}
        }
      }
      setOrgLoaded(true);
    } catch (e) {
      console.error('Error loading SIVES data:', e);
      setOrgLoaded(true);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setInspectingOrg(null);
    setShowSettings(false);
    setShowTimeoutWarning(false);
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
  }, []);

  const resetTimeout = useCallback(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
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
      events.forEach((event) => window.addEventListener(event, resetTimeout));
      resetTimeout();
    }
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
    };
  }, [currentUser, resetTimeout]);

  // Determine active organization context
  const activeOrg = inspectingOrg || currentOrganization;
  const isSuperadmin = currentUser?.role === 'SUPERADMIN' || currentUser?.rol === 'Superadmin';

  // Dynamic CSS variables injection
  useEffect(() => {
    if (isSuperadmin && !inspectingOrg) {
      document.documentElement.style.setProperty('--brand-primary', '#0F172A');
      document.documentElement.style.setProperty('--brand-primary-darker', '#020617');
    } else if (activeOrg?.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', activeOrg.primaryColor);
      try {
        const darker = darkenColor(activeOrg.primaryColor, 12);
        document.documentElement.style.setProperty('--brand-primary-darker', darker);
      } catch {
        document.documentElement.style.setProperty('--brand-primary-darker', '#003366');
      }
    } else {
      document.documentElement.style.setProperty('--brand-primary', '#005A9C');
      document.documentElement.style.setProperty('--brand-primary-darker', '#004B8A');
    }
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [activeOrg, isSuperadmin, inspectingOrg, isHighContrast]);

  // Tenant-filtered entities (strictly deduplicated by ID)
  const orgUsers = useMemo(() => {
    if (!activeOrg) return [];
    const seen = new Set<string>();
    return users
      .filter((u) => u.organizationId === activeOrg.id)
      .filter((u) => {
        if (!u.id || seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
  }, [users, activeOrg]);

  const orgVotes = useMemo(() => {
    if (!activeOrg) return [];
    const seen = new Set<string>();
    return votes
      .filter((v) => v.organizationId === activeOrg.id)
      .filter((v) => {
        if (!v.id || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
  }, [votes, activeOrg]);

  const orgElections = useMemo(() => {
    if (!activeOrg) return [];
    const today = new Date().toISOString().split('T')[0];
    const seen = new Set<string>();
    return elections
      .filter((e) => e.organizationId === activeOrg.id)
      .filter((e) => {
        if (!e.id || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .map((election) => {
        const startDate = election.startDate || election.fecha_inicio;
        const endDate = election.endDate || election.fecha_fin;
        let newStatus: 'Próxima' | 'Activa' | 'Cerrada';
        let statusEnum: 'ACTIVE' | 'UPCOMING' | 'CLOSED';

        if (today > endDate) {
          newStatus = 'Cerrada';
          statusEnum = 'CLOSED';
        } else if (today >= startDate && today <= endDate) {
          newStatus = 'Activa';
          statusEnum = 'ACTIVE';
        } else {
          newStatus = 'Próxima';
          statusEnum = 'UPCOMING';
        }

        return {
          ...election,
          estado: newStatus,
          status: statusEnum,
        };
      });
  }, [elections, activeOrg]);

  const activeElections = useMemo(
    () => orgElections.filter((e) => e.estado === 'Activa' || e.status === 'ACTIVE'),
    [orgElections]
  );

  const votableElectionsForCurrentUser = useMemo(() => {
    if (!currentUser || (currentUser.role !== 'STUDENT' && currentUser.rol !== 'Estudiante')) return [];
    const votedList = currentUser.ha_votado || [];
    return activeElections.filter(
      (e) => !votedList.includes(e.id) && !currentUser.hasVoted?.[e.id]
    );
  }, [currentUser, activeElections]);

  // Unified multi-tenant login handler
  const handleLogin = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    const { mode, organizationId, studentCode, username, password } = credentials;

    // Refresh users list from storage to ensure any recently created admins are recognized
    const latestUsers = await apiService.getUsers();
    setUsers(latestUsers);

    if (mode === 'SUPERADMIN') {
      const superUser = latestUsers.find(
        (u) =>
          (u.role === 'SUPERADMIN' || u.rol === 'Superadmin') &&
          (u.username?.toLowerCase() === username?.toLowerCase() ||
            u.codigo?.toLowerCase() === username?.toLowerCase())
      );
      if (!superUser || (superUser.password && superUser.password !== password)) {
        return { success: false, error: 'Credenciales de Superadministrador incorrectas.' };
      }
      setCurrentUser(superUser);
      setInspectingOrg(null);
      setShowSettings(false);
      return { success: true };
    }

    const targetOrg = organizations.find((o) => o.id === organizationId);
    if (!targetOrg) {
      return { success: false, error: 'Institución no encontrada.' };
    }

    if (mode === 'STUDENT') {
      if (targetOrg.status === 'INACTIVE') {
        return {
          success: false,
          error: 'Esta institución se encuentra suspendida por la administración central.',
        };
      }

      const student = latestUsers.find(
        (u) =>
          u.organizationId === targetOrg.id &&
          (u.role === 'STUDENT' || u.rol === 'Estudiante') &&
          ((u.studentCode && u.studentCode.toLowerCase() === studentCode?.toLowerCase()) ||
            (u.codigo && u.codigo.toLowerCase() === studentCode?.toLowerCase()))
      );

      if (!student) {
        return {
          success: false,
          error: `Código '${studentCode}' no registrado en el padrón de ${targetOrg.name}.`,
        };
      }

      setCurrentOrganization(targetOrg);
      setCurrentUser(student);
      setLastVoteReceipts([]);
      setShowSettings(false);
      return { success: true };
    }

    if (mode === 'ADMIN') {
      const admin = latestUsers.find(
        (u) =>
          u.organizationId === targetOrg.id &&
          (u.role === 'ADMIN' || u.rol === 'Admin') &&
          ((u.username && u.username.toLowerCase() === username?.toLowerCase()) ||
            (u.codigo && u.codigo.toLowerCase() === username?.toLowerCase()))
      );

      if (!admin || (admin.password && admin.password !== password)) {
        return {
          success: false,
          error: 'Usuario o contraseña de administrador escolar incorrectos.',
        };
      }

      setCurrentOrganization(targetOrg);
      setCurrentUser(admin);
      setShowSettings(false);
      return { success: true };
    }

    return { success: false, error: 'Modo de acceso no reconocido.' };
  };

  // Voting handler
  const handleVote = async (
    electionId: string,
    candidateId: string | null,
    isBlankVote: boolean,
    writeInName?: string
  ) => {
    if (!currentUser || !activeOrg) return;
    const { updatedVote, updatedUser } = await apiService.castVote(
      activeOrg.id,
      electionId,
      candidateId,
      currentUser.id,
      writeInName
    );

    setVotes((prev) => [...prev, updatedVote]);
    setUsers((prevUsers) => prevUsers.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    setLastVoteReceipts((prev) => [...prev, updatedVote.receipt]);
  };

  // Election CRUD
  const handleAddElection = async (election: Omit<Election, 'id'>) => {
    if (!activeOrg) return;
    const newElection = await apiService.addElection(election, activeOrg.id);
    setElections((prev) => [...prev.filter((e) => e.id !== newElection.id), newElection]);
  };

  const handleUpdateElection = async (election: Election) => {
    const updated = await apiService.updateElection(election);
    setElections((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteElection = async (id: string) => {
    await apiService.deleteElection(id);
    setElections((prev) => prev.filter((e) => e.id !== id));
  };

  // Candidate CRUD
  const handleAddCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    const newCandidate = await apiService.addCandidate({
      ...candidate,
      organizationId: activeOrg?.id,
    });
    setCandidates((prev) => [...prev.filter((c) => c.id !== newCandidate.id), newCandidate]);
  };

  const handleUpdateCandidate = async (candidate: Candidate) => {
    const updated = await apiService.updateCandidate(candidate);
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCandidate = async (id: string) => {
    await apiService.deleteCandidate(id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  // Voter CRUD
  const handleAddVoter = async (voter: Omit<User, 'id' | 'ha_votado'>) => {
    if (!activeOrg) return;
    const newVoter = await apiService.addUser(voter, activeOrg.id);
    setUsers((prev) => [...prev.filter((u) => u.id !== newVoter.id), newVoter]);
  };

  const handleUpdateUser = async (user: User) => {
    const updated = await apiService.updateUser(user);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser && currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleDeleteVoter = async (id: string) => {
    await apiService.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleImportVoters = async (importedVoters: any[]) => {
    if (!activeOrg) return;
    const newVoters = await apiService.importVoters(importedVoters, activeOrg.id);
    setUsers((prev) => [...prev, ...newVoters]);
  };

  const handleUpdateOrgSettings = async (org: Organization) => {
    const updatedOrg = await apiService.updateOrganization(org.id, org);
    setOrganizations((prev) => prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)));
    if (currentOrganization?.id === updatedOrg.id) {
      setCurrentOrganization(updatedOrg);
    }
    if (inspectingOrg?.id === updatedOrg.id) {
      setInspectingOrg(updatedOrg);
    }
  };

  // Content Renderer with RBAC Guards
  const renderContent = () => {
    if (!orgLoaded) {
      return (
        <div className="text-center py-20 text-slate-500 font-medium">
          Cargando entorno multi-tenant SIVES...
        </div>
      );
    }

    if (!currentUser) {
      return (
        <LoginComponent
          organizations={organizations}
          currentOrganization={currentOrganization}
          onSelectOrganization={handleSelectOrganization}
          onLogin={handleLogin}
        />
      );
    }

    // Role 1: SUPERADMIN
    if (isSuperadmin) {
      if (inspectingOrg) {
        return (
          <div className="space-y-6">
            <div className="bg-indigo-900 text-white px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-indigo-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <SwitchHorizontalIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                    Modo Inspección de Superadministrador
                  </div>
                  <div className="text-sm font-bold">
                    Administrando entorno de: <span className="underline">{inspectingOrg.name}</span> ({inspectingOrg.code})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrg(null)}
                className="px-3.5 py-1.5 bg-white text-indigo-950 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                ← Salir de Inspección y volver a Superadmin
              </button>
            </div>

            <AdminDashboard
              organization={inspectingOrg}
              users={orgUsers}
              elections={orgElections}
              candidates={candidates.filter(
                (c) => c.organizationId === inspectingOrg.id || !c.organizationId
              )}
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
          </div>
        );
      }

      return (
        <SuperAdminDashboard
          currentUser={currentUser}
          onSelectOrganizationAsAdmin={(org) => setInspectingOrg(org)}
        />
      );
    }

    // Role 2: ORG_ADMIN
    if (currentUser.role === 'ADMIN' || currentUser.rol === 'Admin') {
      if (!activeOrg) {
        handleLogout();
        return null;
      }

      if (showSettings) {
        return (
          <SettingsPage
            user={currentUser}
            organization={activeOrg}
            onUpdateUser={handleUpdateUser}
            onUpdateOrganization={handleUpdateOrgSettings}
            onNavigateToDashboard={() => setShowSettings(false)}
          />
        );
      }

      return (
        <AdminDashboard
          organization={activeOrg}
          users={orgUsers}
          elections={orgElections}
          candidates={candidates.filter(
            (c) => c.organizationId === activeOrg.id || !c.organizationId
          )}
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

    // Role 3: STUDENT
    if (currentUser.role === 'STUDENT' || currentUser.rol === 'Estudiante') {
      return (
        <StudentDashboard
          user={currentUser}
          votableElections={votableElectionsForCurrentUser}
          allActiveElections={activeElections}
          closedElectionsWithPublicResults={orgElections.filter(
            (e) => (e.estado === 'Cerrada' || e.status === 'CLOSED') && e.resultados_publicos
          )}
          candidates={candidates}
          votes={orgVotes}
          onVote={handleVote}
          lastVoteReceipts={lastVoteReceipts}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {showTimeoutWarning && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 text-black text-center p-2.5 text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-3">
          <span>Su sesión está por expirar por inactividad.</span>
          <button
            onClick={resetTimeout}
            className="px-2 py-0.5 bg-black text-white rounded text-xs uppercase tracking-wider font-bold"
          >
            Extender Sesión
          </button>
        </div>
      )}

      <Header
        user={currentUser}
        onLogout={handleLogout}
        organization={activeOrg}
        onNavigateToSettings={() => setShowSettings(true)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast((prev) => !prev)}
        isSuperadminImpersonating={!!inspectingOrg}
        onReturnToSuperadmin={() => setInspectingOrg(null)}
      />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default App;
