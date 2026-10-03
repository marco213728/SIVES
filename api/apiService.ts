import { User, UserRole, Election, Candidate, Vote, Organization, AuditLogEntry, SystemMetrics } from '../types';
import {
    organizations as mockOrganizations,
    users as mockUsers,
    elections as mockElections,
    candidates as mockCandidates,
    votes as mockVotes
} from '../mockData';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_STORAGE_PREFIX = 'sives_v2_';

const getInitialData = (collectionName: string) => {
    switch (collectionName) {
        case 'organizations': return mockOrganizations;
        case 'users': return mockUsers;
        case 'elections': return mockElections;
        case 'candidates': return mockCandidates;
        case 'votes': return mockVotes;
        default: return [];
    }
};

const getLocalData = <T>(collectionName: string): T[] => {
    try {
        const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + collectionName);
        if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (collectionName === 'users') {
                    const hasSuper = (parsed as User[]).some(u => u.role === 'SUPERADMIN' || u.username === 'superadmin');
                    if (!hasSuper) {
                        setLocalData('users', mockUsers);
                        return mockUsers as unknown as T[];
                    }
                }
                if (collectionName === 'organizations') {
                    const hasStatus = (parsed as Organization[]).some(o => o.status);
                    if (!hasStatus) {
                        setLocalData('organizations', mockOrganizations);
                        return mockOrganizations as unknown as T[];
                    }
                }
                return parsed;
            }
        }
    } catch {
        // fallback
    }
    const initial = getInitialData(collectionName) as T[];
    try {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + collectionName, JSON.stringify(initial));
    } catch {
        // fallback
    }
    return initial;
};

const setLocalData = <T>(collectionName: string, data: T[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + collectionName, JSON.stringify(data));
    } catch {
        // ignore
    }
};

// Cloud sync & seeding helper
const getCollectionData = async <T extends { id: string }>(collectionName: string): Promise<T[]> => {
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        if (!snapshot.empty) {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
            setLocalData(collectionName, items);
            return items;
        } else {
            // First time cloud initialization: seed Firestore with initial data
            const initial = getLocalData<T>(collectionName);
            for (const item of initial) {
                if (item.id) {
                    await setDoc(doc(db, collectionName, item.id), item).catch(() => {});
                }
            }
            return initial;
        }
    } catch (error) {
        console.warn(`Firestore read failed for '${collectionName}', falling back to local storage:`, error);
        return getLocalData<T>(collectionName);
    }
};

// Recursively strip undefined values so Firestore never throws unsupported field value error
export const sanitizeForFirestore = <T>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return null as any;
    }
    if (Array.isArray(obj)) {
        return obj
            .filter(item => item !== undefined)
            .map(item => sanitizeForFirestore(item)) as any;
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = sanitizeForFirestore(value);
            }
        }
        return cleaned as T;
    }
    return obj;
};

const saveDocument = async <T extends { id: string }>(collectionName: string, docId: string, data: T): Promise<void> => {
    try {
        const cleanData = sanitizeForFirestore(data);
        await setDoc(doc(db, collectionName, docId), cleanData);
    } catch (error) {
        console.error(`Error saving document to Firestore (${collectionName}/${docId}):`, error);
        handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
        throw error;
    }
};

const removeDocument = async (collectionName: string, docId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
        console.error(`Error deleting document from Firestore (${collectionName}/${docId}):`, error);
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
        throw error;
    }
};

// ==========================================
// 1. SUPERADMIN - TENANT & PLATFORM MANAGEMENT
// ==========================================

export const getOrganizations = async (): Promise<Organization[]> => {
    return getCollectionData<Organization>('organizations');
};

export const getOrganizationById = async (id: string): Promise<Organization | null> => {
    const orgs = await getOrganizations();
    return orgs.find(o => o.id === id || o.slug === id) || null;
};

export const createOrganization = async (
    orgData: Omit<Organization, 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Organization> => {
    const orgs = await getOrganizations();
    const cleanName = (orgData.name || '').trim();
    const rawSlug = (
        orgData.id ||
        cleanName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
    );
    const slug = rawSlug || `org-${Date.now()}`;
    const now = new Date().toISOString();
    
    const newOrg: Organization = {
        id: slug,
        slug,
        name: cleanName,
        code: orgData.code?.trim().toUpperCase() || `ORG-${orgs.length + 1}`,
        logoUrl: orgData.logoUrl || null,
        primaryColor: orgData.primaryColor || '#005A9C',
        status: orgData.status || 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        location: orgData.location || '',
        subscriptionType: orgData.subscriptionType || 'Free',
        billingType: orgData.billingType || 'None',
    };

    await saveDocument('organizations', newOrg.id, newOrg);
    const updatedList = [...orgs.filter(o => o.id !== newOrg.id), newOrg];
    setLocalData('organizations', updatedList);
    return newOrg;
};

export const updateOrganization = async (
    id: string,
    updates: Partial<Organization>
): Promise<Organization> => {
    const orgs = await getOrganizations();
    const index = orgs.findIndex(o => o.id === id || o.slug === id);
    if (index === -1) {
        throw new Error(`Organización no encontrada: ${id}`);
    }

    const updated: Organization = {
        ...orgs[index],
        ...updates,
        location: updates.location !== undefined ? (updates.location || '') : (orgs[index].location || ''),
        updatedAt: new Date().toISOString(),
    };

    await saveDocument('organizations', updated.id, updated);
    orgs[index] = updated;
    setLocalData('organizations', orgs);
    return updated;
};

export const deleteOrganization = async (id: string): Promise<void> => {
    const orgs = await getOrganizations();
    const target = orgs.find(o => o.id === id || o.slug === id);
    if (target) {
        await removeDocument('organizations', target.id);
        setLocalData('organizations', orgs.filter(o => o.id !== target.id));
    }
};

export const toggleOrganizationStatus = async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
): Promise<Organization> => {
    return updateOrganization(id, { status });
};

export const createOrgAdmin = async (
    orgId: string,
    adminData: { username: string; name: string; password?: string; email?: string }
): Promise<User> => {
    const users = getLocalData<User>('users');
    const existing = users.find(u => u.username?.toLowerCase() === adminData.username.toLowerCase());
    if (existing) {
        throw new Error(`El nombre de usuario '${adminData.username}' ya está en uso.`);
    }

    const newAdmin: User = {
        id: 'usr_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        organizationId: orgId,
        username: adminData.username,
        codigo: adminData.username,
        name: adminData.name,
        email: adminData.email || `${adminData.username}@${orgId}.sives.edu`,
        password: adminData.password || 'password123',
        role: 'ADMIN',
        rol: 'Admin',
        ha_votado: [],
        hasVoted: {},
        primer_nombre: adminData.name.split(' ')[0] || adminData.name,
        primer_apellido: adminData.name.split(' ').slice(1).join(' ') || 'Administrador',
        curso: 'Administración',
        paralelo: 'Central'
    };

    setLocalData('users', [...users, newAdmin]);
    await saveDocument('users', newAdmin.id, newAdmin).catch(() => {});
    return newAdmin;
};

export const getOrgAdmins = async (orgId?: string): Promise<User[]> => {
    const users = await getUsers(orgId);
    return users.filter(u => u.role === 'ADMIN' || u.rol === 'Admin');
};

export const getSystemMetrics = async (): Promise<SystemMetrics> => {
    const [orgs, elections, users, votes] = await Promise.all([
        getOrganizations(),
        getElections(),
        getUsers(),
        getVotes(),
    ]);

    return {
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === 'ACTIVE').length,
        inactiveOrganizations: orgs.filter(o => o.status === 'INACTIVE').length,
        totalElections: elections.length,
        activeElections: elections.filter(e => e.status === 'ACTIVE' || e.estado === 'Activa').length,
        totalVoters: users.filter(u => u.role === 'STUDENT' || u.rol === 'Estudiante').length,
        totalVotes: votes.length,
    };
};

// ==========================================
// 2. CONTEXT-AWARE TENANT OPERATIONS
// ==========================================

export const getUsers = async (organizationId?: string): Promise<User[]> => {
    const users = await getCollectionData<User>('users');
    if (!organizationId) return users;
    return users.filter(u => u.organizationId === organizationId);
};

export const getVotersByOrg = async (orgId: string): Promise<User[]> => {
    const users = await getUsers(orgId);
    return users.filter(u => u.role === 'STUDENT' || u.rol === 'Estudiante');
};

export const addUser = async (
    userData: Omit<User, 'id' | 'ha_votado' | 'hasVoted'>,
    organizationId: string
): Promise<User> => {
    const users = getLocalData<User>('users');
    const newId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    const role: UserRole = userData.role || (userData.rol === 'Admin' ? 'ADMIN' : 'STUDENT');
    const fullName = userData.name || `${userData.primer_nombre || ''} ${userData.primer_apellido || ''}`.trim() || 'Usuario';

    const newUser: User = {
        ...userData,
        id: newId,
        organizationId,
        name: fullName,
        role,
        studentCode: userData.studentCode || userData.codigo,
        codigo: userData.codigo || userData.studentCode || newId,
        ha_votado: [],
        hasVoted: {},
    };

    setLocalData('users', [...users, newUser]);
    await saveDocument('users', newUser.id, newUser).catch(() => {});
    return newUser;
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const users = getLocalData<User>('users');
    const nextUsers = users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
    setLocalData('users', nextUsers);
    await saveDocument('users', updatedUser.id, updatedUser).catch(() => {});
    return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
    const users = getLocalData<User>('users');
    setLocalData('users', users.filter(u => u.id !== id));
    await removeDocument('users', id).catch(() => {});
};

export const importVoters = async (
    importedVoters: (Partial<User> & { codigo: string })[],
    organizationId: string
): Promise<User[]> => {
    const currentUsers = getLocalData<User>('users');
    const existingCodes = new Set(
        currentUsers
            .filter(u => u.organizationId === organizationId)
            .map(u => (u.studentCode || u.codigo).toLowerCase())
    );

    const newVoters: User[] = [];
    importedVoters.forEach((voter, index) => {
        const code = voter.codigo || voter.studentCode || `code-${index}`;
        if (!existingCodes.has(code.toLowerCase())) {
            const fullName = voter.name || `${voter.primer_nombre || ''} ${voter.primer_apellido || ''}`.trim() || `Estudiante ${code}`;
            const newVoterData: User = {
                id: 'usr_imp_' + Date.now() + '_' + index,
                organizationId,
                name: fullName,
                role: 'STUDENT',
                rol: 'Estudiante',
                studentCode: code,
                codigo: code,
                primer_nombre: voter.primer_nombre || fullName.split(' ')[0],
                primer_apellido: voter.primer_apellido || fullName.split(' ')[1] || '',
                segundo_nombre: voter.segundo_nombre || '',
                segundo_apellido: voter.segundo_apellido || '',
                curso: voter.curso || 'General',
                paralelo: voter.paralelo || 'A',
                email: voter.email,
                ha_votado: [],
                hasVoted: {},
            };
            newVoters.push(newVoterData);
            existingCodes.add(code.toLowerCase());
        }
    });

    if (newVoters.length > 0) {
        setLocalData('users', [...currentUsers, ...newVoters]);
        for (const voter of newVoters) {
            await saveDocument('users', voter.id, voter).catch(() => {});
        }
    }

    return newVoters;
};

// ==========================================
// 3. ELECTIONS (Tenant-Scoped)
// ==========================================

export const getElections = async (organizationId?: string): Promise<Election[]> => {
    const elections = await getCollectionData<Election>('elections');
    if (!organizationId) return elections;
    return elections.filter(e => e.organizationId === organizationId);
};

export const getElectionsByOrg = async (orgId: string): Promise<Election[]> => {
    return getElections(orgId);
};

export const addElection = async (
    electionData: Partial<Election>,
    organizationId: string
): Promise<Election> => {
    const elections = getLocalData<Election>('elections');
    const newId = 'elec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    const title = electionData.title || electionData.nombre || 'Nueva Elección';
    const startDate = electionData.startDate || electionData.fecha_inicio || new Date().toISOString().split('T')[0];
    const endDate = electionData.endDate || electionData.fecha_fin || new Date().toISOString().split('T')[0];
    const description = electionData.description || electionData.descripcion || '';
    
    const today = new Date().toISOString().split('T')[0];
    let status: 'ACTIVE' | 'UPCOMING' | 'CLOSED' = 'UPCOMING';
    let estado: 'Activa' | 'Cerrada' | 'Próxima' = 'Próxima';
    if (today > endDate) {
        status = 'CLOSED';
        estado = 'Cerrada';
    } else if (today >= startDate && today <= endDate) {
        status = 'ACTIVE';
        estado = 'Activa';
    }

    const newElection: Election = {
        id: newId,
        organizationId,
        title,
        nombre: title,
        description,
        descripcion: description,
        startDate,
        fecha_inicio: startDate,
        endDate,
        fecha_fin: endDate,
        status: electionData.status || status,
        estado: electionData.estado || estado,
        allowBlank: electionData.allowBlank !== undefined ? electionData.allowBlank : true,
        allowNull: electionData.allowNull !== undefined ? electionData.allowNull : false,
        allowWriteIn: electionData.allowWriteIn !== undefined ? electionData.allowWriteIn : false,
        resultados_publicos: electionData.resultados_publicos || false,
    };

    setLocalData('elections', [...elections, newElection]);
    await saveDocument('elections', newElection.id, newElection).catch(() => {});
    return newElection;
};

export const updateElection = async (updatedElection: Election): Promise<Election> => {
    const elections = getLocalData<Election>('elections');
    const synced: Election = {
        ...updatedElection,
        nombre: updatedElection.title || updatedElection.nombre,
        title: updatedElection.title || updatedElection.nombre,
        descripcion: updatedElection.description || updatedElection.descripcion,
        description: updatedElection.description || updatedElection.descripcion,
        fecha_inicio: updatedElection.startDate || updatedElection.fecha_inicio,
        startDate: updatedElection.startDate || updatedElection.fecha_inicio,
        fecha_fin: updatedElection.endDate || updatedElection.fecha_fin,
        endDate: updatedElection.endDate || updatedElection.fecha_fin,
    };

    setLocalData('elections', elections.map(e => e.id === synced.id ? synced : e));
    await saveDocument('elections', synced.id, synced).catch(() => {});
    return synced;
};

export const deleteElection = async (id: string): Promise<void> => {
    const elections = getLocalData<Election>('elections');
    setLocalData('elections', elections.filter(e => e.id !== id));
    await removeDocument('elections', id).catch(() => {});
};

// ==========================================
// 4. CANDIDATES (Tenant-Scoped)
// ==========================================

export const getCandidates = async (
    organizationId?: string,
    electionId?: string
): Promise<Candidate[]> => {
    const candidates = await getCollectionData<Candidate>('candidates');
    return candidates.filter(c => {
        if (organizationId && c.organizationId && c.organizationId !== organizationId) return false;
        if (electionId && (c.electionId !== electionId && c.eleccion_id !== electionId)) return false;
        return true;
    });
};

export const addCandidate = async (
    candidateData: Partial<Candidate> & { eleccion_id?: string; electionId?: string }
): Promise<Candidate> => {
    const candidates = getLocalData<Candidate>('candidates');
    const newId = 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const electionId = candidateData.electionId || candidateData.eleccion_id || '';
    
    const elections = getLocalData<Election>('elections');
    const election = elections.find(e => e.id === electionId);
    const orgId = candidateData.organizationId || election?.organizationId || '';

    const fullName = candidateData.name || `${candidateData.nombres || ''} ${candidateData.apellido || ''}`.trim() || 'Candidato';
    const party = candidateData.party || candidateData.partido_politico || 'Independiente';
    const platform = candidateData.platform || candidateData.descripcion || '';
    const photoUrl = candidateData.photoUrl || candidateData.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

    const newCandidate: Candidate = {
        id: newId,
        electionId,
        eleccion_id: electionId,
        organizationId: orgId,
        name: fullName,
        nombres: candidateData.nombres || fullName.split(' ')[0],
        apellido: candidateData.apellido || fullName.split(' ').slice(1).join(' '),
        party,
        partido_politico: party,
        cargo: candidateData.cargo || 'Dignidad Estudiantil',
        platform,
        descripcion: platform,
        photoUrl,
        foto_url: photoUrl,
        color: candidateData.color,
    };

    setLocalData('candidates', [...candidates, newCandidate]);
    await saveDocument('candidates', newCandidate.id, newCandidate).catch(() => {});
    return newCandidate;
};

export const updateCandidate = async (updatedCandidate: Candidate): Promise<Candidate> => {
    const candidates = getLocalData<Candidate>('candidates');
    const synced: Candidate = {
        ...updatedCandidate,
        name: updatedCandidate.name || `${updatedCandidate.nombres} ${updatedCandidate.apellido}`.trim(),
        party: updatedCandidate.party || updatedCandidate.partido_politico,
        platform: updatedCandidate.platform || updatedCandidate.descripcion || '',
        photoUrl: updatedCandidate.photoUrl || updatedCandidate.foto_url,
        electionId: updatedCandidate.electionId || updatedCandidate.eleccion_id,
    };

    setLocalData('candidates', candidates.map(c => c.id === synced.id ? synced : c));
    await saveDocument('candidates', synced.id, synced).catch(() => {});
    return synced;
};

export const deleteCandidate = async (id: string): Promise<void> => {
    const candidates = getLocalData<Candidate>('candidates');
    setLocalData('candidates', candidates.filter(c => c.id !== id));
    await removeDocument('candidates', id).catch(() => {});
};

// ==========================================
// 5. VOTING & AUDIT TRAIL
// ==========================================

export const getVotes = async (
    organizationId?: string,
    electionId?: string
): Promise<Vote[]> => {
    const votes = await getCollectionData<Vote>('votes');
    return votes.filter(v => {
        if (organizationId && v.organizationId !== organizationId) return false;
        if (electionId && (v.eleccion_id !== electionId && v.electionId !== electionId)) return false;
        return true;
    });
};

export const castVote = async (
    orgId: string,
    electionId: string,
    candidateId: string | null,
    voterId: string,
    writeInName?: string
): Promise<{ updatedVote: Vote; updatedUser: User }> => {
    const users = getLocalData<User>('users');
    const userIndex = users.findIndex(u => u.id === voterId);
    if (userIndex === -1) {
        throw new Error('Votante no encontrado en el sistema.');
    }

    const voter = users[userIndex];
    if (voter.organizationId && voter.organizationId !== orgId) {
        throw new Error('Acceso no autorizado: El estudiante pertenece a otra institución.');
    }

    const alreadyVotedList = voter.ha_votado || [];
    if (alreadyVotedList.includes(electionId) || voter.hasVoted?.[electionId]) {
        throw new Error('El estudiante ya ha ejercido su voto en esta elección.');
    }

    const timestamp = new Date().toISOString();
    const hashPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receipt = `RCPT-${orgId.toUpperCase()}-${electionId.slice(-4)}-${hashPart}`;

    const newVote: Vote = {
        id: 'vote_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        organizationId: orgId,
        electionId,
        eleccion_id: electionId,
        user_id: voterId,
        voterId,
        candidato_id: candidateId,
        candidateId,
        write_in_name: writeInName,
        fecha_voto: timestamp,
        timestamp,
        receipt,
    };

    const updatedUser: User = {
        ...voter,
        ha_votado: [...alreadyVotedList, electionId],
        hasVoted: {
            ...(voter.hasVoted || {}),
            [electionId]: true,
        },
    };

    users[userIndex] = updatedUser;
    setLocalData('users', users);

    const votes = getLocalData<Vote>('votes');
    setLocalData('votes', [...votes, newVote]);

    await saveDocument('votes', newVote.id, newVote).catch(() => {});
    await saveDocument('users', updatedUser.id, updatedUser).catch(() => {});

    return { updatedVote: newVote, updatedUser };
};

// Compatibility wrapper for addVote
export const addVote = async (
    userId: string,
    organizationId: string,
    electionId: string,
    candidateId: string | null,
    writeInName?: string
): Promise<{ updatedVote: Vote; updatedUser: User }> => {
    return castVote(organizationId, electionId, candidateId, userId, writeInName);
};

export const getAuditLog = async (organizationId?: string): Promise<AuditLogEntry[]> => {
    const votes = await getVotes(organizationId);
    return votes.map(v => ({
        id: 'audit_' + v.id,
        organizationId: v.organizationId,
        electionId: v.eleccion_id || v.electionId || '',
        receiptCode: v.receipt,
        timestamp: v.fecha_voto || v.timestamp || '',
    }));
};

// ==========================================
// 6. SYSTEM RESET
// ==========================================

export const resetAllData = async (): Promise<void> => {
    setLocalData('organizations', mockOrganizations);
    setLocalData('users', mockUsers);
    setLocalData('elections', mockElections);
    setLocalData('candidates', mockCandidates);
    setLocalData('votes', mockVotes);
};
