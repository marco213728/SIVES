import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    query,
    where,
    runTransaction,
    arrayUnion,
    DocumentData,
    QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Election, Candidate, Vote, Organization } from '../types';

// Helper to map snapshot to data array
const mapSnapshotToData = <T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] => {
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    } as T));
};

// --- Read Operations ---
export const getOrganizations = async (): Promise<Organization[]> => {
    const snapshot = await getDocs(collection(db, 'organizations'));
    return mapSnapshotToData<Organization>(snapshot);
};
// Gets ALL users for initial login check
export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, 'users'));
    return mapSnapshotToData<User>(snapshot);
};

// Scoped reads for organization-specific data
export const getElections = async (organizationId: string): Promise<Election[]> => {
    const q = query(collection(db, 'elections'), where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);
    return mapSnapshotToData<Election>(snapshot);
};
export const getCandidates = async (organizationId: string): Promise<Candidate[]> => {
    // Candidates are linked to elections, which are linked to orgs.
    // This requires a multi-step query or denormalization.
    // For now, let's assume we fetch all and filter client-side, or have a more direct link.
    // A better approach would be to get elections for the org first.
    const elections = await getElections(organizationId);
    const electionIds = elections.map(e => e.id);
    if(electionIds.length === 0) return [];

    const q = query(collection(db, 'candidates'), where('eleccion_id', 'in', electionIds));
    const snapshot = await getDocs(q);
    return mapSnapshotToData<Candidate>(snapshot);
};
export const getVotes = async (organizationId: string): Promise<Vote[]> => {
    const q = query(collection(db, 'votes'), where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);
    return mapSnapshotToData<Vote>(snapshot);
};

// --- SuperAdmin Write Operations ---
export const createOrganizationAndAdmin = async (orgData: Omit<Organization, 'id'>, adminData: Omit<User, 'id' | 'organizationId' | 'rol' | 'ha_votado'>): Promise<{newOrg: Organization, newAdmin: User}> => {
    const batch = writeBatch(db);

    // 1. Create Organization
    const orgRef = doc(collection(db, 'organizations'));
    const newOrg: Organization = { ...orgData, id: orgRef.id };
    batch.set(orgRef, orgData);

    // 2. Create Admin for that Organization
    const adminRef = doc(collection(db, 'users'));
    const newAdmin: User = {
        ...adminData,
        id: adminRef.id,
        organizationId: newOrg.id,
        rol: 'Admin',
        ha_votado: [],
    };
    batch.set(adminRef, { ...adminData, organizationId: newOrg.id, rol: 'Admin', ha_votado: [] });
    
    await batch.commit();

    return { newOrg, newAdmin };
}


// --- Org Admin Write Operations ---

export const addUser = async (userData: Omit<User, 'id' | 'ha_votado'>, organizationId: string): Promise<User> => {
    const newUserPayload = {
        ...userData,
        organizationId,
        ha_votado: [],
    };
    const docRef = await addDoc(collection(db, 'users'), newUserPayload);
    return { ...newUserPayload, id: docRef.id };
};
export const updateUser = async (updatedUser: User): Promise<User> => {
    const userRef = doc(db, 'users', updatedUser.id);
    const { id, ...dataToUpdate } = updatedUser;
    await updateDoc(userRef, dataToUpdate);
    return updatedUser;
};
export const deleteUser = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', id));
};
export const importVoters = async (importedVoters: Pick<User, 'codigo' | 'primer_nombre' | 'segundo_nombre' | 'primer_apellido' | 'segundo_apellido' | 'curso' | 'paralelo'>[], organizationId: string): Promise<User[]> => {
    const usersQuery = query(collection(db, 'users'), where('organizationId', '==', organizationId));
    const querySnapshot = await getDocs(usersQuery);
    const existingCodes = new Set(querySnapshot.docs.map(doc => doc.data().codigo));
    const votersToAdd = importedVoters.filter(voter => !existingCodes.has(voter.codigo));
    if (votersToAdd.length === 0) return [];

    const batch = writeBatch(db);
    const newVoters: User[] = [];
    votersToAdd.forEach(voterData => {
        const newDocRef = doc(collection(db, 'users'));
        const userPayload = {
            ...voterData,
            organizationId,
            rol: 'Estudiante' as const,
            ha_votado: [],
        };
        batch.set(newDocRef, userPayload);
        const newUser: User = { ...userPayload, id: newDocRef.id };
        newVoters.push(newUser);
    });
    await batch.commit();
    return newVoters;
};
export const addElection = async (electionData: Omit<Election, 'id'>, organizationId: string): Promise<Election> => {
    const newElectionPayload = { ...electionData, organizationId };
    const docRef = await addDoc(collection(db, 'elections'), newElectionPayload);
    return { ...newElectionPayload, id: docRef.id };
};
export const updateElection = async (updatedElection: Election): Promise<Election> => {
    const electionRef = doc(db, 'elections', updatedElection.id);
    const { id, ...dataToUpdate } = updatedElection;
    await updateDoc(electionRef, dataToUpdate);
    return updatedElection;
};
export const deleteElection = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'elections', id));
};
export const addCandidate = async (candidateData: Omit<Candidate, 'id'>): Promise<Candidate> => {
    const docRef = await addDoc(collection(db, 'candidates'), candidateData);
    return { ...candidateData, id: docRef.id };
};
export const updateCandidate = async (updatedCandidate: Candidate): Promise<Candidate> => {
    const candidateRef = doc(db, 'candidates', updatedCandidate.id);
    const { id, ...dataToUpdate } = updatedCandidate;
    await updateDoc(candidateRef, dataToUpdate);
    return updatedCandidate;
};
export const deleteCandidate = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'candidates', id));
};
export const addVote = async (userId: string, organizationId: string, electionId: string, candidateId: string | null, writeInName?: string, isNullVote?: boolean): Promise<{ updatedVote: Vote, updatedUser: User }> => {
    let finalVote!: Vote;
    let finalUser!: User;
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist!");
        const currentUserData = { id: userDoc.id, ...userDoc.data() } as User;
        if (currentUserData.ha_votado.includes(electionId)) throw new Error("User has already voted in this election.");
        
        transaction.update(userRef, { ha_votado: arrayUnion(electionId) });
        
        const voteRef = doc(collection(db, 'votes'));
        
        // Construct the vote data object for Firestore
        const voteData: Omit<Vote, 'id'> = {
            organizationId,
            eleccion_id: electionId,
            user_id: userId,
            candidato_id: candidateId,
            fecha_voto: new Date().toISOString(),
            receipt: `rcpt-${electionId.substring(0,4)}-${userId.substring(0,4)}-${voteRef.id.substring(0,5)}`,
        };
        
        // Only include write_in_name if it has a truthy value (not undefined, null, or empty string)
        if (writeInName) {
            voteData.write_in_name = writeInName;
        }

        if (isNullVote) {
            voteData.is_null_vote = true;
        }
        
        transaction.set(voteRef, voteData);

        // Reconstruct the full Vote object for the return value
        finalUser = { ...currentUserData, ha_votado: [...currentUserData.ha_votado, electionId] };
        finalVote = { ...voteData, id: voteRef.id };
    });
    return { updatedVote: finalVote, updatedUser: finalUser };
};
export const updateOrganization = async (updatedOrg: Organization): Promise<Organization> => {
    const orgRef = doc(db, 'organizations', updatedOrg.id);
    const { id, ...dataToUpdate } = updatedOrg;
    await updateDoc(orgRef, dataToUpdate);
    return updatedOrg;
};

export const updateUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("Usuario no encontrado.");
        }
        const userData = userDoc.data();
        if (userData.password !== currentPassword) {
            throw new Error("La contraseña actual es incorrecta.");
        }
        transaction.update(userRef, { password: newPassword });
    });
};

export const resetAllData = async (): Promise<void> => {
    console.warn("Data Reset Aborted: Resetting a live Firestore database from the client is disabled.");
    return Promise.resolve();
};