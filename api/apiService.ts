import { User, Election, Candidate, Vote, Organization } from '../types';
import { db } from './firebase';
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    runTransaction,
    query,
    where,
    writeBatch
} from 'firebase/firestore';
import { organizations as mockOrganizations, users as mockUsers, elections as mockElections, candidates as mockCandidates, votes as mockVotes } from '../mockData';

const getCollectionData = async <T extends {id: string}>(collectionName: string): Promise<T[]> => {
    try {
        const col = collection(db, collectionName);
        const snapshot = await getDocs(col);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        // On error (e.g., Firestore not configured), return an empty array
        return [];
    }
};

// --- Read Operations ---
export const getOrganizations = () => getCollectionData<Organization>('organizations');
export const getUsers = () => getCollectionData<User>('users');
export const getElections = () => getCollectionData<Election>('elections');
export const getCandidates = () => getCollectionData<Candidate>('candidates');
export const getVotes = () => getCollectionData<Vote>('votes');

// --- Write Operations ---

// User/Voter Management
export const addUser = async (userData: Omit<User, 'id' | 'ha_votado'>, organizationId: string): Promise<User> => {
    const dataToSave = {
        ...userData,
        organizationId,
        ha_votado: [],
    };
    const docRef = await addDoc(collection(db, 'users'), dataToSave);
    return { ...dataToSave, id: docRef.id };
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const { id, organizationId, codigo, rol, ha_votado, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, curso, paralelo, email, password } = updatedUser;
    // Create a plain object to prevent circular structure errors
    const dataToUpdate = { organizationId, codigo, rol, ha_votado, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, curso, paralelo, email, password };
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, dataToUpdate);
    return updatedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', id));
};

export const importVoters = async (importedVoters: Omit<User, 'id' | 'rol' | 'ha_votado'>[], organizationId: string): Promise<User[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('organizationId', '==', organizationId));
    const orgUsersSnapshot = await getDocs(q);
    const existingCodes = new Set(orgUsersSnapshot.docs.map(d => d.data().codigo));

    const batch = writeBatch(db);
    const newVoters: User[] = [];

    importedVoters.forEach(voter => {
        if (!existingCodes.has(voter.codigo)) {
            const newVoterData = {
                ...voter,
                organizationId,
                rol: 'Estudiante' as 'Estudiante',
                ha_votado: [],
            };
            const docRef = doc(collection(db, 'users'));
            batch.set(docRef, newVoterData);
            newVoters.push({ ...newVoterData, id: docRef.id });
        }
    });

    if (newVoters.length > 0) {
        await batch.commit();
    }
    
    return newVoters;
};

// Election Management
export const addElection = async (electionData: Omit<Election, 'id'>, organizationId: string): Promise<Election> => {
    const dataToSave = { ...electionData, organizationId };
    const docRef = await addDoc(collection(db, 'elections'), dataToSave);
    return { ...dataToSave, id: docRef.id };
};

export const updateElection = async (updatedElection: Election): Promise<Election> => {
    const { id, organizationId, nombre, fecha_inicio, fecha_fin, estado, resultados_publicos, descripcion } = updatedElection;
    // Create a plain object to prevent circular structure errors
    const dataToUpdate = { organizationId, nombre, fecha_inicio, fecha_fin, estado, resultados_publicos, descripcion };
    const electionRef = doc(db, 'elections', id);
    await updateDoc(electionRef, dataToUpdate);
    return updatedElection;
};

export const deleteElection = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'elections', id));
};

// Candidate Management
export const addCandidate = async (candidateData: Omit<Candidate, 'id'>): Promise<Candidate> => {
    const docRef = await addDoc(collection(db, 'candidates'), candidateData);
    return { ...candidateData, id: docRef.id };
};

export const updateCandidate = async (updatedCandidate: Candidate): Promise<Candidate> => {
    const { id, eleccion_id, nombres, apellido, partido_politico, cargo, foto_url, descripcion } = updatedCandidate;
    // Create a plain object to prevent circular structure errors
    const dataToUpdate = { eleccion_id, nombres, apellido, partido_politico, cargo, foto_url, descripcion };
    const candidateRef = doc(db, 'candidates', id);
    await updateDoc(candidateRef, dataToUpdate);
    return updatedCandidate;
};

export const deleteCandidate = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'candidates', id));
};

// Voting
export const addVote = async (userId: string, organizationId: string, electionId: string, candidateId: string | null, writeInName?: string): Promise<{ updatedVote: Vote, updatedUser: User }> => {
    return runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        
        const currentUserData = { id: userSnap.id, ...userSnap.data() } as User;
        
        // Prevent double voting
        if (currentUserData.ha_votado.includes(electionId)) {
            throw new Error("User has already voted in this election.");
        }

        const updatedUser: User = { 
            ...currentUserData, 
            ha_votado: [...currentUserData.ha_votado, electionId] 
        };
        transaction.update(userRef, { ha_votado: updatedUser.ha_votado });

        const voteData: Omit<Vote, 'id'> = {
            organizationId,
            eleccion_id: electionId,
            user_id: userId,
            candidato_id: candidateId,
            write_in_name: writeInName,
            fecha_voto: new Date().toISOString(),
            receipt: `rcpt-${electionId}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
        };

        const voteRef = doc(collection(db, "votes"));
        transaction.set(voteRef, voteData);

        const updatedVote: Vote = { ...voteData, id: voteRef.id };

        return { updatedVote, updatedUser };
    });
};

// Organization Management
export const updateOrganization = async (updatedOrg: Organization): Promise<Organization> => {
    const { id, slug, name, logoUrl, primaryColor } = updatedOrg;
    // Create a plain object to prevent circular structure errors
    const dataToUpdate = { slug, name, logoUrl, primaryColor };
    const orgRef = doc(db, 'organizations', id);
    await updateDoc(orgRef, dataToUpdate);
    return updatedOrg;
};

// --- System ---
const seedDatabase = async () => {
    console.log("Seeding database with mock data...");
    const batch = writeBatch(db);
    mockOrganizations.forEach(item => batch.set(doc(db, 'organizations', item.id), item));
    mockUsers.forEach(item => batch.set(doc(db, 'users', item.id), item));
    mockElections.forEach(item => batch.set(doc(db, 'elections', item.id), item));
    mockCandidates.forEach(item => batch.set(doc(db, 'candidates', item.id), item));
    mockVotes.forEach(item => batch.set(doc(db, 'votes', item.id), item));
    await batch.commit();
    console.log("Database seeded successfully.");
};

export const resetAllData = async (): Promise<void> => {
    console.log("Resetting all data...");
    const collections = ['organizations', 'users', 'elections', 'candidates', 'votes'];
    try {
        for (const colName of collections) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            if(snapshot.empty) continue;

            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            console.log(`Cleared collection: ${colName}`);
        }
        await seedDatabase();
    } catch (error) {
        console.error("Error resetting data:", error);
    }
};