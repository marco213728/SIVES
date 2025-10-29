import { User, Election, Candidate, Vote, Organization } from '../types';
import { organizations as mockOrganizations, users as mockUsers, elections as mockElections, candidates as mockCandidates, votes as mockVotes } from '../mockData';

const LS_KEYS = {
    organizations: 'sives_organizations',
    users: 'sives_users',
    elections: 'sives_elections',
    candidates: 'sives_candidates',
    votes: 'sives_votes',
};

// Helper to get data from localStorage or return mock data if not present
const getData = <T,>(key: string, mockData: T[]): T[] => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : mockData;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return mockData;
    }
};

// Helper to save data to localStorage
const saveData = <T,>(key: string, data: T[]): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
    }
};

// Simulate async API calls
const simulateAsync = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 50));
};

// --- Read Operations ---
export const getOrganizations = () => simulateAsync(getData<Organization>(LS_KEYS.organizations, mockOrganizations));
export const getUsers = () => simulateAsync(getData<User>(LS_KEYS.users, mockUsers));
export const getElections = () => simulateAsync(getData<Election>(LS_KEYS.elections, mockElections));
export const getCandidates = () => simulateAsync(getData<Candidate>(LS_KEYS.candidates, mockCandidates));
export const getVotes = () => simulateAsync(getData<Vote>(LS_KEYS.votes, mockVotes));

// --- Write Operations ---

// User/Voter Management
export const addUser = async (userData: Omit<User, 'id' | 'ha_votado'>, organizationId: number): Promise<User> => {
    const users = await getUsers();
    const newUser: User = {
        ...userData,
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        organizationId,
        ha_votado: [],
    };
    const updatedUsers = [...users, newUser];
    saveData(LS_KEYS.users, updatedUsers);
    return simulateAsync(newUser);
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const users = await getUsers();
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    saveData(LS_KEYS.users, updatedUsers);
    return simulateAsync(updatedUser);
};

export const deleteUser = async (id: number): Promise<void> => {
    let users = await getUsers();
    users = users.filter(u => u.id !== id);
    saveData(LS_KEYS.users, users);
    return simulateAsync(undefined);
};

export const importVoters = async (importedVoters: Omit<User, 'id' | 'rol' | 'ha_votado'>[], organizationId: number): Promise<User[]> => {
    const users = await getUsers();
    const existingCodes = new Set(users.filter(u => u.organizationId === organizationId).map(u => u.codigo));
    let maxId = Math.max(0, ...users.map(u => u.id));
    
    const newVoters: User[] = importedVoters
        .filter(iv => !existingCodes.has(iv.codigo))
        .map(v => {
            maxId++;
            return {
                ...v,
                id: maxId,
                organizationId: organizationId,
                rol: 'Estudiante' as 'Estudiante',
                ha_votado: [],
            };
        });

    if (newVoters.length > 0) {
        const updatedUsers = [...users, ...newVoters];
        saveData(LS_KEYS.users, updatedUsers);
    }
    return simulateAsync(newVoters);
};

// Election Management
export const addElection = async (electionData: Omit<Election, 'id'>, organizationId: number): Promise<Election> => {
    const elections = await getElections();
    const newElection: Election = {
        ...electionData,
        id: Math.max(0, ...elections.map(e => e.id)) + 1,
        organizationId
    };
    const updatedElections = [...elections, newElection];
    saveData(LS_KEYS.elections, updatedElections);
    return simulateAsync(newElection);
};

export const updateElection = async (updatedElection: Election): Promise<Election> => {
    const elections = await getElections();
    const updatedElections = elections.map(e => e.id === updatedElection.id ? updatedElection : e);
    saveData(LS_KEYS.elections, updatedElections);
    return simulateAsync(updatedElection);
};

export const deleteElection = async (id: number): Promise<void> => {
    let elections = await getElections();
    elections = elections.filter(e => e.id !== id);
    saveData(LS_KEYS.elections, elections);
    return simulateAsync(undefined);
};

// Candidate Management
export const addCandidate = async (candidateData: Omit<Candidate, 'id'>): Promise<Candidate> => {
    const candidates = await getCandidates();
    const newCandidate: Candidate = {
        ...candidateData,
        id: Math.max(0, ...candidates.map(c => c.id)) + 1,
    };
    const updatedCandidates = [...candidates, newCandidate];
    saveData(LS_KEYS.candidates, updatedCandidates);
    return simulateAsync(newCandidate);
};

export const updateCandidate = async (updatedCandidate: Candidate): Promise<Candidate> => {
    const candidates = await getCandidates();
    const updatedCandidates = candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c);
    saveData(LS_KEYS.candidates, updatedCandidates);
    return simulateAsync(updatedCandidate);
};

export const deleteCandidate = async (id: number): Promise<void> => {
    let candidates = await getCandidates();
    candidates = candidates.filter(c => c.id !== id);
    saveData(LS_KEYS.candidates, candidates);
    return simulateAsync(undefined);
};

// Voting
export const addVote = async (userId: number, organizationId: number, electionId: number, candidateId: number | null, writeInName?: string): Promise<{ updatedVote: Vote, updatedUser: User }> => {
    const votes = await getVotes();
    const users = await getUsers();
    
    const newVote: Vote = {
        id: Math.max(0, ...votes.map(v => v.id)) + 1,
        organizationId,
        eleccion_id: electionId,
        user_id: userId,
        candidato_id: candidateId,
        write_in_name: writeInName,
        fecha_voto: new Date().toISOString(),
        receipt: `rcpt-${electionId}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updatedVotes = [...votes, newVote];
    saveData(LS_KEYS.votes, updatedVotes);

    const userToUpdate = users.find(u => u.id === userId)!;
    const updatedUser = { ...userToUpdate, ha_votado: [...userToUpdate.ha_votado, electionId] };
    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    saveData(LS_KEYS.users, updatedUsers);

    return simulateAsync({ updatedVote: newVote, updatedUser });
};

// Organization Management
export const updateOrganization = async (updatedOrg: Organization): Promise<Organization> => {
    const organizations = await getOrganizations();
    const updatedOrganizations = organizations.map(o => o.id === updatedOrg.id ? updatedOrg : o);
    saveData(LS_KEYS.organizations, updatedOrganizations);
    return simulateAsync(updatedOrg);
};


// --- System ---
export const resetAllData = async (): Promise<void> => {
    Object.values(LS_KEYS).forEach(key => {
        window.localStorage.removeItem(key);
    });
    return simulateAsync(undefined);
};
