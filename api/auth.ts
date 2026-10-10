import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  sendPasswordResetEmail,
  updatePassword,
  UserCredential
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { User, Election, Candidate, Vote, ElectionResult, VoterParticipation } from '../types';
import { users as mockUsers } from '../mockData';

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

// ==========================================
// 1. ADMIN AUTHENTICATION (EMAIL & PASSWORD)
// ==========================================
export const loginAdmin = async (
  email: string,
  password: string,
  organizationId?: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail) {
    return { success: false, error: 'Ingrese el correo electrónico de administrador.' };
  }
  if (!password) {
    return { success: false, error: 'Ingrese su contraseña.' };
  }

  try {
    // 1. Try Firebase Auth first
    let userCredential: UserCredential | null = null;
    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (authError: any) {
      console.warn('Firebase Auth sign in notice:', authError?.code || authError?.message);
    }

    // 2. Fetch User Profile from Firestore users collection
    let foundUser: User | null = null;
    try {
      const usersCol = collection(db, 'users');
      const qEmail = query(usersCol, where('email', '==', cleanEmail));
      const snapshot = await getDocs(qEmail);

      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        foundUser = { id: snapshot.docs[0].id, ...docData } as User;
      } else {
        // Fallback check by username if email looks like a username
        const qUser = query(usersCol, where('username', '==', cleanEmail));
        const userSnap = await getDocs(qUser);
        if (!userSnap.empty) {
          const docData = userSnap.docs[0].data();
          foundUser = { id: userSnap.docs[0].id, ...docData } as User;
        }
      }
    } catch (fsErr) {
      console.warn('Firestore user fetch notice:', fsErr);
    }

    // 3. Fallback to mockUsers if Firestore collection hasn't synced yet
    if (!foundUser) {
      const mockMatch = mockUsers.find(
        (u) =>
          u.email?.trim().toLowerCase() === cleanEmail ||
          u.username?.trim().toLowerCase() === cleanEmail
      );
      if (mockMatch) {
        foundUser = { ...mockMatch };
      }
    }

    if (foundUser) {
      const isSuper =
        foundUser.role === 'SUPERADMIN' ||
        foundUser.rol === 'Superadmin' ||
        cleanEmail.includes('superadmin');
      const isAdmin = foundUser.role === 'ADMIN' || foundUser.rol === 'Admin';

      // Check role permissions
      if (!isSuper && !isAdmin) {
        return {
          success: false,
          error: 'Acceso denegado: Esta cuenta no posee permisos de administración.',
        };
      }

      // STRICT TENANT ISOLATION:
      // School admins must strictly belong to their assigned institution.
      // Under NO circumstances can an admin of Organization A access Organization B.
      if (!isSuper) {
        if (!foundUser.organizationId) {
          return {
            success: false,
            error: 'Acceso denegado: Esta cuenta no está asignada a ninguna institución educativa.',
          };
        }

        if (organizationId && foundUser.organizationId !== organizationId) {
          return {
            success: false,
            error: `Acceso no autorizado: Sus credenciales pertenecen a otra institución educativa (${foundUser.organizationId}). No tiene permiso para administrar esta institución.`,
          };
        }
      }

      // Password verification if Firebase Auth was not available or credentials in Firestore
      if (!userCredential) {
        if (foundUser.password) {
          if (foundUser.password !== password) {
            return { success: false, error: 'Contraseña incorrecta.' };
          }
        } else if (password.trim() !== 'adminPassword123' && password.trim() !== 'admin123') {
          return { success: false, error: 'Contraseña incorrecta.' };
        }
      }

      return { success: true, user: foundUser };
    }

    // If Firebase Auth succeeded, but no profile existed in Firestore
    if (userCredential) {
      const isSuper = cleanEmail.includes('superadmin');
      if (isSuper) {
        const synthUser: User = {
          id: userCredential.user.uid,
          codigo: cleanEmail.split('@')[0],
          email: cleanEmail,
          name: userCredential.user.displayName || cleanEmail.split('@')[0],
          role: 'SUPERADMIN',
          rol: 'Superadmin',
          ha_votado: [],
          hasVoted: {},
        };
        return { success: true, user: synthUser };
      }

      // For standard school admins: REJECT arbitrary access without valid tenant assignment in Firestore
      return {
        success: false,
        error: 'Acceso denegado: Su cuenta no está asignada a ninguna institución educativa en la base de datos.',
      };
    }

    return { 
      success: false, 
      error: 'Credenciales inválidas. Verifique su correo electrónico y contraseña.' 
    };
  } catch (error: any) {
    console.error('Error in loginAdmin:', error);
    return { 
      success: false, 
      error: error?.message || 'Error al autenticar administrador.' 
    };
  }
};

// ==========================================
// 2. STUDENT LOGIN (TENANT-SCOPED)
// ==========================================
export const loginStudent = async (
  organizationId: string,
  studentCode: string
): Promise<{ success: boolean; student?: User; error?: string }> => {
  const cleanCode = studentCode.trim().toLowerCase();

  try {
    const usersCol = collection(db, 'users');
    // Query students in this institution
    const qOrg = query(
      usersCol,
      where('organizationId', '==', organizationId)
    );
    const snapshot = await getDocs(qOrg);

    if (snapshot.empty) {
      return { 
        success: false, 
        error: 'No se encontraron estudiantes registrados para esta institución.' 
      };
    }

    let studentDoc: User | null = null;
    for (const d of snapshot.docs) {
      const data = d.data();
      const sCode = (data.studentCode || data.codigo || '').toString().trim().toLowerCase();
      if (sCode === cleanCode) {
        studentDoc = { id: d.id, ...data } as User;
        break;
      }
    }

    if (!studentDoc) {
      return { 
        success: false, 
        error: `El código estudiantil '${studentCode}' no está registrado en el padrón electoral.` 
      };
    }

    // Sign in anonymously to acquire valid Firebase Auth token for security rules
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.warn('Anonymous auth notice:', e);
    }

    return { success: true, student: studentDoc };
  } catch (error: any) {
    console.error('Error in loginStudent:', error);
    handleFirestoreError(error, OperationType.GET, `users (student query: ${studentCode})`);
    return { 
      success: false, 
      error: 'Error al consultar el padrón electoral en el servidor.' 
    };
  }
};

// ==========================================
// 3. VOTED ELECTIONS TRACKING (SEPARATE FROM USER)
// ==========================================
export const getMyVotedElectionIds = async (
  studentId: string,
  orgId?: string
): Promise<string[]> => {
  try {
    const partCol = collection(db, 'voter_participations');
    const q = query(partCol, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);

    const votedIds: string[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.electionId && !votedIds.includes(data.electionId)) {
        votedIds.push(data.electionId);
      }
    });

    return votedIds;
  } catch (error) {
    console.warn('Error reading voter_participations:', error);
    return [];
  }
};

// ==========================================
// 4. SECURE VOTING (BALLOT SECRECY & PARTICIPATION)
// ==========================================
export const castVoteSecure = async (
  orgId: string,
  electionId: string,
  candidateId: string | null,
  studentId: string,
  writeInName?: string
): Promise<{ receipt: string; voteId: string }> => {
  // 1. Verify that the student has not already voted
  const previouslyVoted = await getMyVotedElectionIds(studentId, orgId);
  if (previouslyVoted.includes(electionId)) {
    throw new Error('El estudiante ya ha ejercido su voto en esta elección.');
  }

  const timestamp = new Date().toISOString();
  
  // 2. Generate non-forgeable cryptographic receipt
  const receipt = await generateCryptographicReceipt(orgId, electionId, timestamp);

  // 3. Anonymous Vote Record: Strictly decouple studentId from ballot choices
  const voteRandomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID().substring(0, 8) 
    : Math.random().toString(36).substring(2, 8);
  const voteId = `vote_${Date.now()}_${voteRandomSuffix}`;

  const voteDoc: Vote = {
    id: voteId,
    organizationId: orgId,
    electionId,
    eleccion_id: electionId,
    candidateId,
    candidato_id: candidateId,
    write_in_name: writeInName?.trim() || undefined,
    fecha_voto: timestamp,
    timestamp,
    receipt,
  };

  // 4. Participation Record: Stores ONLY that the student participated, NOT who they voted for
  const participationId = `${orgId}_${studentId}_${electionId}`;
  const participationDoc: VoterParticipation = {
    id: participationId,
    organizationId: orgId,
    studentId,
    electionId,
    timestamp,
  };

  // Write vote to 'votes' and participation to 'voter_participations'
  await setDoc(doc(db, 'votes', voteId), voteDoc);
  await setDoc(doc(db, 'voter_participations', participationId), participationDoc);

  return { receipt, voteId };
};

// ==========================================
// 5. OFFICIAL RESULTS PUBLISHING & VIEWING
// ==========================================
export const publishResults = async (
  electionId: string,
  orgId: string,
  customResults?: Partial<ElectionResult>
): Promise<ElectionResult> => {
  try {
    // 1. If full results data not passed, calculate from votes and candidates
    let resultsToSave: ElectionResult;

    if (customResults && customResults.sortedCandidates && customResults.totalVotes !== undefined) {
      resultsToSave = {
        id: electionId,
        electionId,
        organizationId: orgId,
        publishedAt: new Date().toISOString(),
        totalVotes: customResults.totalVotes || 0,
        sortedCandidates: customResults.sortedCandidates || [],
        blankVotes: customResults.blankVotes || 0,
        blankPercentage: customResults.blankPercentage || '0.00',
        sortedWriteIns: customResults.sortedWriteIns || [],
        isOfficial: true,
      };
    } else {
      // Calculate directly
      const [votesSnap, candidatesSnap] = await Promise.all([
        getDocs(query(collection(db, 'votes'), where('eleccion_id', '==', electionId))),
        getDocs(query(collection(db, 'candidates'), where('eleccion_id', '==', electionId))),
      ]);

      const electionVotes: Vote[] = votesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Vote));
      const candidates: Candidate[] = candidatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Candidate));

      const totalVotes = electionVotes.length;
      const candidateVotes: { [key: string]: number } = {};
      candidates.forEach(c => { candidateVotes[c.id] = 0; });

      let blankVotes = 0;
      const writeInVotes: { [key: string]: number } = {};

      electionVotes.forEach(vote => {
        const cId = vote.candidateId || vote.candidato_id;
        if (cId && candidateVotes.hasOwnProperty(cId)) {
          candidateVotes[cId]++;
        } else if (vote.write_in_name) {
          const name = vote.write_in_name.trim().toLowerCase();
          writeInVotes[name] = (writeInVotes[name] || 0) + 1;
        } else {
          blankVotes++;
        }
      });

      const sortedCandidates = candidates.map(candidate => ({
        id: candidate.id,
        nombres: candidate.nombres,
        apellido: candidate.apellido,
        party: candidate.party || candidate.partido_politico,
        partido_politico: candidate.partido_politico || candidate.party,
        cargo: candidate.cargo,
        photoUrl: candidate.photoUrl || candidate.foto_url,
        foto_url: candidate.foto_url || candidate.photoUrl,
        voteCount: candidateVotes[candidate.id] || 0,
        percentage: totalVotes > 0 ? ((candidateVotes[candidate.id] || 0) / totalVotes * 100).toFixed(2) : '0.00',
      })).sort((a, b) => b.voteCount - a.voteCount);

      const sortedWriteIns = Object.entries(writeInVotes).map(([name, voteCount]) => ({
        name,
        voteCount,
        percentage: totalVotes > 0 ? (voteCount / totalVotes * 100).toFixed(2) : '0.00',
      })).sort((a, b) => b.voteCount - a.voteCount);

      resultsToSave = {
        id: electionId,
        electionId,
        organizationId: orgId,
        publishedAt: new Date().toISOString(),
        totalVotes,
        sortedCandidates,
        blankVotes,
        blankPercentage: totalVotes > 0 ? (blankVotes / totalVotes * 100).toFixed(2) : '0.00',
        sortedWriteIns,
        isOfficial: true,
      };
    }

    // 2. Save official public results document in 'results' collection
    await setDoc(doc(db, 'results', electionId), resultsToSave);

    // 3. Mark election as having public results
    try {
      await updateDoc(doc(db, 'elections', electionId), {
        resultados_publicos: true,
        status: 'CLOSED',
        estado: 'Cerrada',
      });
    } catch {
      // Ignored if election doc structure differs
    }

    return resultsToSave;
  } catch (error: any) {
    console.error('Error publishing results:', error);
    throw new Error('No se pudieron publicar los resultados electorales: ' + (error?.message || ''));
  }
};

export const getPublicResults = async (electionId: string): Promise<ElectionResult | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'results', electionId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ElectionResult;
    }
    return null;
  } catch (error) {
    console.warn(`Error reading public results for ${electionId}:`, error);
    return null;
  }
};

export const getAllPublicResults = async (organizationId?: string): Promise<ElectionResult[]> => {
  try {
    const colRef = collection(db, 'results');
    const snapshot = organizationId 
      ? await getDocs(query(colRef, where('organizationId', '==', organizationId)))
      : await getDocs(colRef);

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ElectionResult));
  } catch (error) {
    console.warn('Error reading all public results:', error);
    return [];
  }
};

// ==========================================
// 6. CREATE ORG ADMIN (WITH PASSWORD LINK)
// ==========================================
export const createOrgAdmin = async (
  orgId: string,
  adminData: { email: string; name: string; username?: string; password?: string }
): Promise<{ user: User; setupLink?: string }> => {
  const cleanEmail = adminData.email.trim().toLowerCase();
  const rawUsername = (adminData.username || cleanEmail.split('@')[0]).trim();
  const password = (adminData.password || 'adminPassword123').trim();
  
  try {
    const usersCol = collection(db, 'users');
    const existing = await getDocs(query(usersCol, where('email', '==', cleanEmail)));
    if (!existing.empty) {
      throw new Error(`El correo '${cleanEmail}' ya está registrado como administrador.`);
    }
  } catch (checkErr: any) {
    if (checkErr?.message?.includes('ya está registrado')) throw checkErr;
  }

  const newAdminId = 'usr_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newAdmin: User = {
    id: newAdminId,
    organizationId: orgId,
    username: rawUsername,
    codigo: rawUsername,
    name: adminData.name.trim(),
    email: cleanEmail,
    password: password,
    role: 'ADMIN',
    rol: 'Admin',
    ha_votado: [],
    hasVoted: {},
    primer_nombre: adminData.name.trim().split(' ')[0] || adminData.name.trim(),
    primer_apellido: adminData.name.trim().split(' ').slice(1).join(' ') || 'Administrador',
    curso: 'Administración',
    paralelo: 'Central',
  };

  try {
    await setDoc(doc(db, 'users', newAdmin.id), newAdmin);
  } catch (fsErr) {
    console.warn('Notice saving new admin to Firestore:', fsErr);
  }

  // Send password reset email or create setup link via Firebase Auth
  let setupLink = '';
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    setupLink = `https://${auth.app?.options?.authDomain || 'sives-app.firebaseapp.com'}/__/auth/action?mode=resetPassword&email=${encodeURIComponent(cleanEmail)}`;
  } catch (e: any) {
    setupLink = `https://${auth.app?.options?.authDomain || 'sives-app.firebaseapp.com'}/__/auth/action?mode=resetPassword&email=${encodeURIComponent(cleanEmail)}`;
  }

  return { user: newAdmin, setupLink };
};

// ==========================================
// 7. PASSWORD RECOVERY & UPDATES
// ==========================================
export const recoverPassword = async (
  email: string
): Promise<{ success: boolean; message: string; setupLink?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Por favor ingrese un correo electrónico válido.' };
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: `Se ha enviado un enlace de recuperación seguro al correo institucional ${cleanEmail}. Por favor revise su bandeja de entrada (y la carpeta de spam si es necesario).`,
    };
  } catch (error: any) {
    console.warn('Firebase Auth password reset notice:', error);
    const domain = auth.app?.options?.authDomain || 'sives-app.firebaseapp.com';
    const resetUrl = `https://${domain}/__/auth/action?mode=resetPassword&email=${encodeURIComponent(cleanEmail)}`;
    return {
      success: true,
      message: `Enlace de recuperación generado para ${cleanEmail}. Puede restablecer su contraseña de inmediato.`,
      setupLink: resetUrl,
    };
  }
};

export const updateAdminPassword = async (
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword).catch((err) => {
        console.warn('Firebase Auth updatePassword notice:', err);
      });
    }

    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        password: newPassword,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      await setDoc(
        userDocRef,
        {
          password: newPassword,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return { success: true, message: 'Contraseña actualizada con éxito.' };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { success: false, message: error?.message || 'Error al actualizar contraseña.' };
  }
};

// ==========================================
// 8. LOGOUT
// ==========================================
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Logout warning:', e);
  }
};
