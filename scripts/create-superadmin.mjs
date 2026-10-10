#!/usr/bin/env node
/**
 * scripts/create-superadmin.mjs
 * 
 * Script para inicializar o restaurar la cuenta Superadministrador de SIVES
 * en Firebase Authentication y Cloud Firestore.
 * 
 * Uso:
 *   node scripts/create-superadmin.mjs [email] [password]
 * 
 * Ejemplo:
 *   node scripts/create-superadmin.mjs superadmin@sives.edu.ec "MiClaveSegura2025!@#"
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Cargar configuración de Firebase
const configPath = resolve(process.cwd(), 'firebase-applet-config.json');
if (!existsSync(configPath)) {
  console.error('Error: No se encontró firebase-applet-config.json en el directorio actual.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2] || 'superadmin@sives.edu.ec';
const password = process.argv[3] || 'SuperAdmin2025!SivesSeguro';

if (password.length < 8) {
  console.error('Error de seguridad: La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

async function run() {
  console.log('==============================================');
  console.log('   SIVES - Inicialización de Superadministrador');
  console.log('==============================================');
  console.log(`Proyecto: ${firebaseConfig.projectId}`);
  console.log(`Correo:   ${email}`);

  let uid = '';

  try {
    console.log('\n1. Verificando/Creando usuario en Firebase Authentication...');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`   ✓ Usuario creado en Firebase Auth con UID: ${uid}`);
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-in-use') {
        console.log('   ℹ El usuario ya existe en Firebase Auth. Iniciando sesión para confirmar credenciales...');
        const loginCred = await signInWithEmailAndPassword(auth, email, password);
        uid = loginCred.user.uid;
        console.log(`   ✓ Credenciales verificadas con UID: ${uid}`);
      } else {
        throw authErr;
      }
    }

    console.log('\n2. Guardando perfil con privilegios en Firestore (colección: users)...');
    const superAdminDoc = {
      id: uid || 'usr_superadmin',
      email: email.toLowerCase(),
      username: email.split('@')[0],
      codigo: 'SUPERADMIN',
      name: 'Superadministrador Global SIVES',
      role: 'SUPERADMIN',
      rol: 'Superadmin',
      primer_nombre: 'Superadministrador',
      primer_apellido: 'Global',
      curso: 'SIVES Central',
      paralelo: 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Guardar tanto por UID como por usr_superadmin para máxima compatibilidad
    await setDoc(doc(db, 'users', superAdminDoc.id), superAdminDoc);
    await setDoc(doc(db, 'users', 'usr_superadmin'), superAdminDoc);
    console.log('   ✓ Perfil de Superadministrador registrado exitosamente en Firestore.');

    console.log('\n==============================================');
    console.log('   ¡Configuración completada con éxito!');
    console.log('   Ahora puedes iniciar sesión en el portal con:');
    console.log(`   Correo:     ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log('==============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante la creación del superadministrador:', err.message || err);
    process.exit(1);
  }
}

run();
