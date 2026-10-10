import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. loginStudent
 * Authenticates student by studentCode and organizationId.
 * Creates custom token with tenant and role claims.
 */
export const loginStudent = functions.https.onCall(async (data, context) => {
  const { organizationId, studentCode } = data || {};
  if (!organizationId || !studentCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere código de estudiante e institución.'
    );
  }

  const cleanCode = studentCode.trim().toLowerCase();
  const snapshot = await db
    .collection('users')
    .where('organizationId', '==', organizationId)
    .get();

  let student: any = null;
  for (const doc of snapshot.docs) {
    const d = doc.data();
    const code = (d.studentCode || d.codigo || '').toString().trim().toLowerCase();
    if (code === cleanCode) {
      student = { id: doc.id, ...d };
      break;
    }
  }

  if (!student) {
    throw new functions.https.HttpsError(
      'not-found',
      `El código estudiantil '${studentCode}' no está registrado en el padrón.`
    );
  }

  // Generate custom token
  let customToken = '';
  try {
    customToken = await admin.auth().createCustomToken(student.id, {
      role: 'STUDENT',
      organizationId,
    });
  } catch (error: any) {
    console.warn('Could not generate custom token, ensure Service Account Token Creator role:', error);
  }

  return { student, customToken };
});

/**
 * 2. castVoteSecure
 * Atomically writes anonymous vote to 'votes' and participation to 'voter_participations'
 */
export const castVoteSecure = functions.https.onCall(async (data, context) => {
  const { orgId, electionId, candidateId, studentId, writeInName } = data || {};
  if (!orgId || !electionId || !studentId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Parámetros incompletos para procesar el voto.'
    );
  }

  const participationRef = db.collection('voter_participations').doc(`${orgId}_${studentId}_${electionId}`);
  const existingPart = await participationRef.get();
  if (existingPart.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      'El estudiante ya ha ejercido su voto en esta elección.'
    );
  }

  const timestamp = new Date().toISOString();
  const receiptPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const receipt = `RCPT-${orgId.toUpperCase()}-${electionId.slice(-4)}-${receiptPart}`;
  const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const batch = db.batch();

  // 1. Anonymous vote (No voter identity)
  const voteRef = db.collection('votes').doc(voteId);
  batch.set(voteRef, {
    id: voteId,
    organizationId: orgId,
    electionId,
    eleccion_id: electionId,
    candidateId: candidateId || null,
    candidato_id: candidateId || null,
    write_in_name: writeInName ? writeInName.trim() : null,
    fecha_voto: timestamp,
    timestamp,
    receipt,
  });

  // 2. Participation marker (Decoupled from ballot choice)
  batch.set(participationRef, {
    id: `${orgId}_${studentId}_${electionId}`,
    organizationId: orgId,
    studentId,
    electionId,
    timestamp,
  });

  await batch.commit();
  return { receipt, voteId };
});

/**
 * 3. getMyVotedElectionIds
 * Returns array of election IDs the student has voted in
 */
export const getMyVotedElectionIds = functions.https.onCall(async (data, context) => {
  const { studentId, orgId } = data || {};
  if (!studentId) {
    throw new functions.https.HttpsError('invalid-argument', 'studentId requerido');
  }

  let query: admin.firestore.Query = db.collection('voter_participations').where('studentId', '==', studentId);
  if (orgId) {
    query = query.where('organizationId', '==', orgId);
  }

  const snapshot = await query.get();
  const votedIds: string[] = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    if (d.electionId && !votedIds.includes(d.electionId)) {
      votedIds.push(d.electionId);
    }
  });

  return { votedIds };
});

/**
 * 4. publishResults
 * Tally votes and publish aggregated result to 'results/{electionId}'
 */
export const publishResults = functions.https.onCall(async (data, context) => {
  const { electionId, orgId } = data || {};
  if (!electionId || !orgId) {
    throw new functions.https.HttpsError('invalid-argument', 'Parámetros incompletos');
  }

  const [votesSnap, candidatesSnap] = await Promise.all([
    db.collection('votes').where('eleccion_id', '==', electionId).get(),
    db.collection('candidates').where('eleccion_id', '==', electionId).get(),
  ]);

  const totalVotes = votesSnap.size;
  const candidateVotes: { [key: string]: number } = {};
  const candidates: any[] = [];

  candidatesSnap.forEach((doc) => {
    const c = { id: doc.id, ...doc.data() };
    candidates.push(c);
    candidateVotes[c.id] = 0;
  });

  let blankVotes = 0;
  const writeInVotes: { [key: string]: number } = {};

  votesSnap.forEach((doc) => {
    const vote = doc.data();
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

  const sortedCandidates = candidates.map((c) => ({
    id: c.id,
    nombres: c.nombres,
    apellido: c.apellido,
    party: c.party || c.partido_politico,
    cargo: c.cargo,
    photoUrl: c.photoUrl || c.foto_url,
    voteCount: candidateVotes[c.id] || 0,
    percentage: totalVotes > 0 ? ((candidateVotes[c.id] || 0) / totalVotes * 100).toFixed(2) : '0.00',
  })).sort((a, b) => b.voteCount - a.voteCount);

  const sortedWriteIns = Object.entries(writeInVotes).map(([name, voteCount]) => ({
    name,
    voteCount,
    percentage: totalVotes > 0 ? (voteCount / totalVotes * 100).toFixed(2) : '0.00',
  })).sort((a, b) => b.voteCount - a.voteCount);

  const publishedDoc = {
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

  await db.collection('results').doc(electionId).set(publishedDoc);
  await db.collection('elections').doc(electionId).update({
    resultados_publicos: true,
    status: 'CLOSED',
    estado: 'Cerrada',
  }).catch(() => {});

  return publishedDoc;
});

/**
 * 5. createOrgAdmin
 * Provisions an admin user and sends password setup email
 */
export const createOrgAdmin = functions.https.onCall(async (data, context) => {
  const { orgId, email, name } = data || {};
  if (!orgId || !email || !name) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, nombre y colegio requeridos');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Create in Auth
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(cleanEmail);
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        displayName: name,
      });
    } else {
      throw e;
    }
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'ADMIN',
    organizationId: orgId,
  });

  // Store in users collection
  const adminDoc = {
    id: userRecord.uid,
    organizationId: orgId,
    email: cleanEmail,
    name,
    role: 'ADMIN',
    rol: 'Admin',
    username: cleanEmail.split('@')[0],
    codigo: cleanEmail.split('@')[0],
    createdAt: new Date().toISOString(),
  };

  await db.collection('users').doc(userRecord.uid).set(adminDoc);
  const resetLink = await admin.auth().generatePasswordResetLink(cleanEmail).catch(() => '');

  return { user: adminDoc, resetLink };
});
