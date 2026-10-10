import { User, UserRole, Election, Candidate, Vote, Organization, AuditLogEntry, SystemMetrics } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
    castVoteSecure, 
    getMyVotedElectionIds, 
    publishResults, 
    getPublicResults, 
    getAllPublicResults, 
    loginAdmin, 
    loginStudent,
    logout 
} from './auth';

export { 
    castVoteSecure, 
    getMyVotedElectionIds, 
    publishResults, 
    getPublicResults, 
    getAllPublicResults, 
    loginAdmin, 
    loginStudent,
    logout 
};

const LOCAL_STORAGE_PREFIX = 'sives_v2_';

const deduplicateList = <T>(list: T[]): T[] => {
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    return list.filter((item: any) => {
        if (item && typeof item === 'object' && item.id) {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        }
        return true;
    });
};

const getLocalData = <T>(collectionName: string): T[] => {
    // SECURITY: Users and votes are strictly confidential and must NEVER be stored in or retrieved from browser localStorage
    if (collectionName === 'users' || collectionName === 'votes') {
        return [];
    }
    try {
        const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + collectionName);
        if (item) {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return deduplicateList(parsed) as T[];
            }
        }
    } catch {
        // fallback
    }
    return [];
};

const setLocalData = <T>(collectionName: string, data: T[]) => {
    // SECURITY: Never persist users credentials or ballot votes to browser localStorage
    if (collectionName === 'users' || collectionName === 'votes') {
        return;
    }
    try {
        const clean = deduplicateList(data);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + collectionName, JSON.stringify(clean));
    } catch {
        // ignore
    }
};

// Cloud Firestore data retriever (No mock data auto-seeding when empty)
const getCollectionData = async <T extends { id: string }>(collectionName: string): Promise<T[]> => {
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        if (!snapshot.empty) {
            const seen = new Set<string>();
            const items: T[] = [];
            for (const d of snapshot.docs) {
                const item = { id: d.id, ...d.data() } as T;
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    items.push(item);
                }
            }
            if (collectionName !== 'users' && collectionName !== 'votes') {
                setLocalData(collectionName, items);
            }
            return items;
        } else {
            // When collection is empty, return empty array without filling Firestore with mockData
            return [];
        }
    } catch (error) {
        console.warn(`Firestore read failed for '${collectionName}':`, error);
        if (collectionName === 'users' || collectionName === 'votes') {
            return [];
        }
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
    const cleanEmail = (adminData.email || `${adminData.username}@${orgId}.sives.edu`).trim().toLowerCase();
    const users = await getUsers();
    const existing = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanEmail) || 
        (u.username && u.username.toLowerCase() === adminData.username.toLowerCase())
    );
    if (existing) {
        throw new Error(`El administrador '${adminData.username}' ya existe.`);
    }

    const newAdmin: User = {
        id: 'usr_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        organizationId: orgId,
        username: adminData.username,
        codigo: adminData.username,
        name: adminData.name,
        email: cleanEmail,
        role: 'ADMIN',
        rol: 'Admin',
        ha_votado: [],
        hasVoted: {},
        primer_nombre: adminData.name.split(' ')[0] || adminData.name,
        primer_apellido: adminData.name.split(' ').slice(1).join(' ') || 'Administrador',
        curso: 'Administración',
        paralelo: 'Central'
    };

    await saveDocument('users', newAdmin.id, newAdmin);
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

    await saveDocument('users', newUser.id, newUser);
    return newUser;
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    await saveDocument('users', updatedUser.id, updatedUser);
    return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
    await removeDocument('users', id);
};

export const importVoters = async (
    importedVoters: (Partial<User> & { codigo: string })[],
    organizationId: string
): Promise<User[]> => {
    const currentUsers = await getUsers(organizationId);
    const existingCodes = new Set(
        currentUsers.map(u => (u.studentCode || u.codigo).toLowerCase())
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

    const nextElections = [...elections.filter(e => e.id !== newElection.id), newElection];
    setLocalData('elections', nextElections);
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

// Helper: Non-forgeable SHA-256 cryptographic receipt generator using Web Crypto API
async function generateCryptographicReceipt(orgId: string, electionId: string, timestamp: string): Promise<string> {
    try {
        const entropy = `${orgId}:${electionId}:${timestamp}:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)}`;
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(entropy);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            return `RCPT-${orgId.toUpperCase()}-${electionId.slice(-4)}-${hashHex.substring(0, 12)}`;
        }
    } catch {
        // Fallback if subtle crypto is unavailable
    }
    const hashPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `RCPT-${orgId.toUpperCase()}-${electionId.slice(-4)}-${hashPart}`;
}

export const castVote = async (
    orgId: string,
    electionId: string,
    candidateId: string | null,
    voterId: string,
    writeInName?: string
): Promise<{ updatedVote: Vote; updatedUser: User }> => {
    // SECURITY: Use castVoteSecure to prevent storing votes in browser localStorage
    const { receipt, voteId } = await castVoteSecure(
        orgId,
        electionId,
        candidateId,
        voterId,
        writeInName
    );

    const timestamp = new Date().toISOString();
    const updatedVote: Vote = {
        id: voteId,
        organizationId: orgId,
        electionId,
        eleccion_id: electionId,
        candidato_id: candidateId,
        candidateId,
        write_in_name: writeInName?.trim() || undefined,
        fecha_voto: timestamp,
        timestamp,
        receipt,
    };

    const updatedUser: User = {
        id: voterId,
        codigo: voterId,
        studentCode: voterId,
        role: 'STUDENT',
        ha_votado: [electionId],
        hasVoted: { [electionId]: true },
    };

    return { updatedVote, updatedUser };
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
    // SECURITY: Data resetting from client is permanently disabled for production database safety
    console.info('Reset prevented: Database integrity preserved.');
};
